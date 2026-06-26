/*
 * SPDX-License-Identifier: Apache-2.0
 */

package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing carbon credits
type SmartContract struct {
	contractapi.Contract
}

// Credit represents a carbon credit on the blockchain
type Credit struct {
	SerialNumber      string   `json:"serialNumber"`
	ProjectID         string   `json:"projectId"`
	ProjectName       string   `json:"projectName"`
	VintageYear       int      `json:"vintageYear"`
	Quantity          float64  `json:"quantity"`
	VerificationStd   string   `json:"verificationStandard"`
	Owner             string   `json:"owner"`
	Status            string   `json:"status"` // active, retired, transferred
	AuthorizationID   string   `json:"authorizationId"`
	ITMOStatus        string   `json:"itmoStatus"` // authorized, transferred
	CreatedAt         string   `json:"createdAt"`
	MintedBy          string   `json:"mintedBy"`
	History           []Event  `json:"history"`
}

// Event represents a lifecycle event for a credit
type Event struct {
	EventType string `json:"eventType"`
	Timestamp string `json:"timestamp"`
	From      string `json:"from,omitempty"`
	To        string `json:"to,omitempty"`
	TxHash    string `json:"txHash"`
	Details   string `json:"details,omitempty"`
}

// RetirementRecord represents a retirement transaction
type RetirementRecord struct {
	SerialNumbers     []string `json:"serialNumbers"`
	RetirementID      string   `json:"retirementId"`
	Owner             string   `json:"owner"`
	Purpose           string   `json:"purpose"`
	RetirementDate    string   `json:"retirementDate"`
	CorrespondingAdj  bool     `json:"correspondingAdjustment"`
	UNFCCCReportURL   string   `json:"unfcccReportUrl"`
}

// Authorization represents an Article 6 authorization
type Authorization struct {
	AuthorizationID   string   `json:"authorizationId"`
	ProjectID         string   `json:"projectId"`
	AuthorizedQuantity float64 `json:"authorizedQuantity"`
	BuyerCountry      string   `json:"buyerCountry"`
	Purpose           string   `json:"purpose"`
	Status            string   `json:"status"` // pending, approved, rejected, transferred
	AuthorizedBy      string   `json:"authorizedBy"`
	AuthorizedAt      string   `json:"authorizedAt"`
	Conditions        []string `json:"conditions"`
}

// InitLedger adds a base set of credits to the ledger
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	credits := []Credit{
		{
			SerialNumber:    "ZAI-2024-A7B3C9D2E1F0",
			ProjectID:       "proj-001",
			ProjectName:     "Kariba REDD+",
			VintageYear:     2024,
			Quantity:        1.0,
			VerificationStd: "VCS",
			Owner:           "ZCR",
			Status:          "active",
			ITMOStatus:      "",
			CreatedAt:       time.Now().UTC().Format(time.RFC3339),
			MintedBy:        "ZCR",
			History: []Event{
				{
					EventType: "MINTED",
					Timestamp: time.Now().UTC().Format(time.RFC3339),
					TxHash:    "init",
					Details:   "Initial ledger setup",
				},
			},
		},
	}

	for _, credit := range credits {
		creditJSON, err := json.Marshal(credit)
		if err != nil {
			return err
		}

		err = ctx.GetStub().PutState(credit.SerialNumber, creditJSON)
		if err != nil {
			return fmt.Errorf("failed to put to world state: %v", err)
		}
	}

	return nil
}

// MintCredits issues new carbon credits to the specified owner
func (s *SmartContract) MintCredits(
	ctx contractapi.TransactionContextInterface,
	serialNumber string,
	projectID string,
	projectName string,
	vintageYear int,
	quantity float64,
	verificationStd string,
	owner string,
) (*Credit, error) {
	
	exists, err := s.CreditExists(ctx, serialNumber)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("the credit %s already exists", serialNumber)
	}

	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return nil, err
	}
	
	// Only ZCR (Zimbabwe Carbon Registry) can mint credits
	if clientMSPID != "ZCRMSP" {
		return nil, fmt.Errorf("only ZCR can mint credits")
	}

	credit := Credit{
		SerialNumber:    serialNumber,
		ProjectID:       projectID,
		ProjectName:     projectName,
		VintageYear:     vintageYear,
		Quantity:        quantity,
		VerificationStd: verificationStd,
		Owner:           owner,
		Status:          "active",
		ITMOStatus:      "",
		CreatedAt:       time.Now().UTC().Format(time.RFC3339),
		MintedBy:        clientMSPID,
		History: []Event{
			{
				EventType: "MINTED",
				Timestamp: time.Now().UTC().Format(time.RFC3339),
				TxHash:    ctx.GetStub().GetTxID(),
				Details:   fmt.Sprintf("Minted by %s for project %s", clientMSPID, projectID),
			},
		},
	}

	creditJSON, err := json.Marshal(credit)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(serialNumber, creditJSON)
	if err != nil {
		return nil, err
	}

	return &credit, nil
}

// TransferCredits transfers credits from current owner to new owner
func (s *SmartContract) TransferCredits(
	ctx contractapi.TransactionContextInterface,
	serialNumber string,
	newOwner string,
	transferType string,
) (*Credit, error) {
	
	credit, err := s.ReadCredit(ctx, serialNumber)
	if err != nil {
		return nil, err
	}

	if credit.Status != "active" {
		return nil, fmt.Errorf("credit %s is not active (status: %s)", serialNumber, credit.Status)
	}

	oldOwner := credit.Owner
	credit.Owner = newOwner
	
	event := Event{
		EventType: "TRANSFERRED",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		From:      oldOwner,
		To:        newOwner,
		TxHash:    ctx.GetStub().GetTxID(),
		Details:   fmt.Sprintf("Transfer type: %s", transferType),
	}
	credit.History = append(credit.History, event)

	creditJSON, err := json.Marshal(credit)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(serialNumber, creditJSON)
	if err != nil {
		return nil, err
	}

	return credit, nil
}

// RetireCredits marks credits as retired
func (s *SmartContract) RetireCredits(
	ctx contractapi.TransactionContextInterface,
	serialNumbers []string,
	purpose string,
	correspondingAdj bool,
) (*RetirementRecord, error) {
	
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return nil, err
	}

	retirementID := fmt.Sprintf("RET-%s-%d", ctx.GetStub().GetTxID()[:8], time.Now().Unix())
	
	for _, sn := range serialNumbers {
		credit, err := s.ReadCredit(ctx, sn)
		if err != nil {
			return nil, err
		}

		if credit.Status != "active" {
			return nil, fmt.Errorf("credit %s is not active", sn)
		}

		credit.Status = "retired"
		event := Event{
			EventType: "RETIRED",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			From:      credit.Owner,
			TxHash:    ctx.GetStub().GetTxID(),
			Details:   fmt.Sprintf("Retired for %s", purpose),
		}
		credit.History = append(credit.History, event)

		creditJSON, err := json.Marshal(credit)
		if err != nil {
			return nil, err
		}

		err = ctx.GetStub().PutState(sn, creditJSON)
		if err != nil {
			return nil, err
		}
	}

	record := RetirementRecord{
		SerialNumbers:    serialNumbers,
		RetirementID:     retirementID,
		Owner:            clientMSPID,
		Purpose:          purpose,
		RetirementDate:   time.Now().UTC().Format(time.RFC3339),
		CorrespondingAdj: correspondingAdj,
		UNFCCCReportURL:  fmt.Sprintf("https://zcr.gov.zw/reports/%s", retirementID),
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(retirementID, recordJSON)
	if err != nil {
		return nil, err
	}

	return &record, nil
}

// AuthorizeITMO marks credits as authorized for Article 6 transfer
func (s *SmartContract) AuthorizeITMO(
	ctx contractapi.TransactionContextInterface,
	authorizationID string,
	serialNumbers []string,
	buyerCountry string,
	purpose string,
) (*Authorization, error) {
	
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return nil, err
	}

	// Only ZiCMA can authorize ITMOs
	if clientMSPID != "ZiCMAMSP" {
		return nil, fmt.Errorf("only ZiCMA can authorize ITMOs")
	}

	totalQuantity := 0.0
	for _, sn := range serialNumbers {
		credit, err := s.ReadCredit(ctx, sn)
		if err != nil {
			return nil, err
		}

		if credit.Status != "active" {
			return nil, fmt.Errorf("credit %s is not active", sn)
		}

		credit.ITMOStatus = "authorized"
		credit.AuthorizationID = authorizationID
		event := Event{
			EventType: "ITMO_AUTHORIZED",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			TxHash:    ctx.GetStub().GetTxID(),
			Details:   fmt.Sprintf("Authorized for transfer to %s", buyerCountry),
		}
		credit.History = append(credit.History, event)

		creditJSON, err := json.Marshal(credit)
		if err != nil {
			return nil, err
		}

		err = ctx.GetStub().PutState(sn, creditJSON)
		if err != nil {
			return nil, err
		}

		totalQuantity += credit.Quantity
	}

	auth := Authorization{
		AuthorizationID:    authorizationID,
		ProjectID:          "",
		AuthorizedQuantity: totalQuantity,
		BuyerCountry:       buyerCountry,
		Purpose:            purpose,
		Status:             "approved",
		AuthorizedBy:       clientMSPID,
		AuthorizedAt:       time.Now().UTC().Format(time.RFC3339),
		Conditions:         []string{"Transfer within 12 months", "Report to UNFCCC"},
	}

	authJSON, err := json.Marshal(auth)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(authorizationID, authJSON)
	if err != nil {
		return nil, err
	}

	return &auth, nil
}

// ReadCredit returns the credit stored in the world state with given serial number
func (s *SmartContract) ReadCredit(ctx contractapi.TransactionContextInterface, serialNumber string) (*Credit, error) {
	creditJSON, err := ctx.GetStub().GetState(serialNumber)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if creditJSON == nil {
		return nil, fmt.Errorf("the credit %s does not exist", serialNumber)
	}

	var credit Credit
	err = json.Unmarshal(creditJSON, &credit)
	if err != nil {
		return nil, err
	}

	return &credit, nil
}

// CreditExists returns true when credit with given serial number exists
func (s *SmartContract) CreditExists(ctx contractapi.TransactionContextInterface, serialNumber string) (bool, error) {
	creditJSON, err := ctx.GetStub().GetState(serialNumber)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return creditJSON != nil, nil
}

// GetAllCredits returns all credits found in world state
func (s *SmartContract) GetAllCredits(ctx contractapi.TransactionContextInterface) ([]*Credit, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var credits []*Credit
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var credit Credit
		err = json.Unmarshal(queryResponse.Value, &credit)
		if err != nil {
			// Skip non-credit entries
			continue
		}
		credits = append(credits, &credit)
	}

	return credits, nil
}

// GetCreditsByProject returns all credits for a specific project
func (s *SmartContract) GetCreditsByProject(ctx contractapi.TransactionContextInterface, projectID string) ([]*Credit, error) {
	queryString := fmt.Sprintf(`{"selector":{"projectId":"%s"}}`, projectID)
	return s.queryCredits(ctx, queryString)
}

// GetCreditsByOwner returns all credits owned by a specific entity
func (s *SmartContract) GetCreditsByOwner(ctx contractapi.TransactionContextInterface, owner string) ([]*Credit, error) {
	queryString := fmt.Sprintf(`{"selector":{"owner":"%s"}}`, owner)
	return s.queryCredits(ctx, queryString)
}

// GetCreditsByStatus returns all credits with a specific status
func (s *SmartContract) GetCreditsByStatus(ctx contractapi.TransactionContextInterface, status string) ([]*Credit, error) {
	queryString := fmt.Sprintf(`{"selector":{"status":"%s"}}`, status)
	return s.queryCredits(ctx, queryString)
}

// queryCredits performs a rich query on the ledger
func (s *SmartContract) queryCredits(ctx contractapi.TransactionContextInterface, queryString string) ([]*Credit, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var credits []*Credit
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var credit Credit
		err = json.Unmarshal(queryResponse.Value, &credit)
		if err != nil {
			continue
		}
		credits = append(credits, &credit)
	}

	return credits, nil
}

// GetCreditHistory returns the transaction history for a credit
func (s *SmartContract) GetCreditHistory(ctx contractapi.TransactionContextInterface, serialNumber string) ([]Event, error) {
	credit, err := s.ReadCredit(ctx, serialNumber)
	if err != nil {
		return nil, err
	}
	return credit.History, nil
}

// QueryAuthorizations returns all authorizations matching criteria
func (s *SmartContract) QueryAuthorizations(
	ctx contractapi.TransactionContextInterface,
	status string,
) ([]*Authorization, error) {
	
	queryString := fmt.Sprintf(`{"selector":{"status":"%s"}}`, status)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var auths []*Authorization
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var auth Authorization
		err = json.Unmarshal(queryResponse.Value, &auth)
		if err != nil {
			continue
		}
		auths = append(auths, &auth)
	}

	return auths, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		fmt.Printf("Error creating carbon credit chaincode: %v", err)
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting carbon credit chaincode: %v", err)
	}
}
