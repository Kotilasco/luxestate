import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import GavelIcon from "@mui/icons-material/Gavel";
import MapIcon from "@mui/icons-material/Map";
import SecurityIcon from "@mui/icons-material/Security";
import VerifiedIcon from "@mui/icons-material/Verified";

const metrics = [
  ["714+", "Registered Projects"],
  ["48%", "MRV Automation Coverage"],
  ["12/7", "Regulatory Support"],
  ["920+", "Credits in Pipeline"]
];

const domains = [
  ["Carbon Registry", "Project registration, credit issuance, serialization, transfers, and retirement.", <VerifiedIcon key="registry" />],
  ["GIS Intelligence", "Districts, forest cover, fire alerts, carbon density, communities, sensors, and rainfall.", <MapIcon key="gis" />],
  ["AI Governance", "PDD Copilot, Legal Copilot, fraud detection, forecasting, and satellite intelligence.", <AnalyticsIcon key="ai" />],
  ["Blockchain Ledger", "Hyperledger Fabric anchoring for issuance, transfer, retirement, and audit history.", <AccountTreeIcon key="ledger" />],
  ["Regulatory Portal", "SI 48 of 2025 workflows, Article 6 readiness, approvals, and compliance reporting.", <GavelIcon key="reg" />],
  ["Zero Trust Security", "OAuth2/OIDC, JWT, RBAC, ABAC, MFA, immutable audit, and SIEM-ready events.", <SecurityIcon key="sec" />]
];

export default function Home() {
  return (
    <main>
      <section className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zai-blue">Government Platform</p>
            <h1 className="text-2xl font-bold text-zai-ink">ZAI-CTS</h1>
          </div>
          <nav className="hidden gap-8 text-sm font-semibold text-slate-700 md:flex">
            <a href="#registry">Registry</a>
            <a href="#gis">GIS</a>
            <a href="#ai">AI</a>
            <a href="#security">Security</a>
          </nav>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(rgba(255,255,255,.72)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.72)_1px,transparent_1px)] bg-[size:60px_60px] px-6 py-20">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <span className="rounded-full border border-sky-300 bg-sky-100 px-4 py-2 text-sm font-bold text-zai-blue">
              Zimbabwe AI-Enhanced Carbon Trading Ecosystem
            </span>
            <h2 className="mt-8 text-5xl font-bold leading-tight text-zai-ink md:text-6xl">
              National carbon market infrastructure for SI 48 of 2025 and Article 6
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              A production-grade, auditable, AI-native, GIS-first platform for carbon projects, MRV, credit issuance, trading, community transparency, and regulatory oversight.
            </p>
          </div>

          <div className="mt-14 grid gap-4 rounded-lg border bg-white p-6 shadow-sm md:grid-cols-4">
            {metrics.map(([value, label]) => (
              <div key={label} className="rounded-md border p-5 text-center">
                <strong className="block text-3xl text-zai-blue">{value}</strong>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <span className="rounded-full bg-sky-100 px-4 py-2 text-sm font-bold uppercase tracking-wider text-zai-blue">
            Enterprise Domains
          </span>
          <h2 className="mt-5 text-4xl font-bold text-zai-ink">Production architecture foundation</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {domains.map(([title, body, icon]) => (
            <article key={title.toString()} className="rounded-lg border bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-sky-100 text-zai-blue">
                {icon}
              </div>
              <h3 className="text-xl font-bold text-zai-ink">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="security" className="bg-zai-blue px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold">Zero Trust, audit-first, cloud and on-prem ready</h2>
          <p className="mt-4 max-w-3xl text-sky-100">
            Built for OAuth2/OIDC, RBAC, ABAC, MFA, immutable audit trails, Prometheus metrics, Kubernetes deployments, and enterprise review gates.
          </p>
        </div>
      </section>
    </main>
  );
}
