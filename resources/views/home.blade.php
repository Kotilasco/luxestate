<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LuxEstate - Real Estate Template</title>
  <meta name="description" content="LuxEstate real estate listings, agents, services, and property opportunities.">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
  <link href="{{ asset('css/luxestate.css') }}" rel="stylesheet">
</head>
<body>
@php
  $assetBase = 'https://bootstrapmade.com/content/demo/LuxEstate/assets/img/';
@endphp

<div class="top-strip">
  <div class="container-xl d-flex justify-content-between align-items-center">
    <div class="d-flex flex-wrap gap-4">
      <span><i class="bi bi-envelope"></i> contact@example.com</span>
      <span><i class="bi bi-phone"></i> +1 5589 55488 55</span>
    </div>
    <div class="socials d-none d-md-flex">
      <a href="#" aria-label="X"><i class="bi bi-twitter-x"></i></a>
      <a href="#" aria-label="Facebook"><i class="bi bi-facebook"></i></a>
      <a href="#" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
      <a href="#" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>
    </div>
  </div>
</div>

<header class="site-header sticky-top">
  <nav class="navbar navbar-expand-lg">
    <div class="container-xl">
      <a class="navbar-brand" href="#hero">LuxEstate</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div id="mainNav" class="collapse navbar-collapse">
        <ul class="navbar-nav ms-auto align-items-lg-center">
          <li class="nav-item"><a class="nav-link active" href="#hero">Home</a></li>
          <li class="nav-item"><a class="nav-link" href="#about">About</a></li>
          <li class="nav-item"><a class="nav-link" href="#properties">Properties</a></li>
          <li class="nav-item"><a class="nav-link" href="#services">Services</a></li>
          <li class="nav-item"><a class="nav-link" href="#agents">Agents</a></li>
          <li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">More Pages</a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#properties">Property Details</a></li>
              <li><a class="dropdown-item" href="#services">Service Details</a></li>
              <li><a class="dropdown-item" href="#agents">Agent Profile</a></li>
            </ul>
          </li>
          <li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Dropdown</a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#testimonials">Testimonials</a></li>
              <li><a class="dropdown-item" href="#why-us">Why Us</a></li>
              <li><a class="dropdown-item" href="#contact">Contact</a></li>
            </ul>
          </li>
          <li class="nav-item"><a class="nav-link" href="#contact">Contact</a></li>
        </ul>
      </div>
    </div>
  </nav>
</header>

<main>
  <section id="hero" class="hero-section">
    <div class="hero-icon icon-one"><i class="bi bi-house"></i></div>
    <div class="hero-icon icon-two"><i class="bi bi-key"></i></div>
    <div class="hero-icon icon-three"><i class="bi bi-geo-alt"></i></div>
    <div class="container-xl">
      <div class="hero-copy text-center mx-auto">
        <span class="pill"><i class="bi bi-building"></i> Curated Listings</span>
        <h1>Find Your Dream Property<br>with Confidence</h1>
        <p>Quisque velit nisi, pretium ut lacinia in, elementum id enim. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Explore verified listings from top-rated professionals.</p>
      </div>
      <form class="search-card">
        <div class="row g-3 align-items-end">
          <div class="col-lg-3">
            <label class="form-label">Location</label>
            <input class="form-control" type="text" placeholder="Enter city or zip">
          </div>
          <div class="col-lg-2">
            <label class="form-label">Type</label>
            <select class="form-select"><option>Any Type</option><option>House</option><option>Apartment</option></select>
          </div>
          <div class="col-lg-2">
            <label class="form-label">Budget</label>
            <select class="form-select"><option>Any Price</option><option>$500K+</option><option>$1M+</option></select>
          </div>
          <div class="col-lg-2">
            <label class="form-label">Rooms</label>
            <select class="form-select"><option>Any</option><option>3+</option><option>5+</option></select>
          </div>
          <div class="col-lg-3">
            <button class="btn btn-primary w-100" type="button"><i class="bi bi-search"></i> Search Properties</button>
          </div>
        </div>
      </form>
      <div class="hero-property row g-3">
        <div class="col-lg-7">
          <div class="featured-image">
            <img src="{{ $assetBase }}real-estate/property-exterior-5.webp" alt="Featured exterior">
            <span class="tag">Featured</span>
            <strong>$725,000</strong>
          </div>
        </div>
        <div class="col-lg-5">
          <img class="side-image" src="{{ $assetBase }}real-estate/property-interior-4.webp" alt="Modern living room">
          <div class="agent-mini">
            <div class="d-flex align-items-center gap-3">
              <img src="{{ $assetBase }}real-estate/agent-7.webp" alt="Michael Torres">
              <div>
                <h3>Michael Torres</h3>
                <p>Senior Property Advisor</p>
              </div>
            </div>
            <div class="agent-rating">
              <span><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i></span>
              <small>4.8 (203 reviews)</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="about" class="section white-section">
    <div class="container-xl">
      <div class="row g-5 align-items-center">
        <div class="col-lg-5">
          <div class="about-grid">
            <div class="award"><i class="bi bi-award-fill"></i><strong data-count="7" data-suffix="+">0+</strong><span>Honors Received</span></div>
            <img class="about-main" src="{{ $assetBase }}real-estate/property-exterior-4.webp" alt="Luxury home">
            <img src="{{ $assetBase }}real-estate/property-interior-3.webp" alt="Kitchen">
            <img src="{{ $assetBase }}real-estate/agent-7.webp" alt="Agent">
          </div>
        </div>
        <div class="col-lg-7">
          <span class="pill"><i class="bi bi-buildings"></i> Premium Real Estate</span>
          <h2>Elevating Property Experiences Beyond Expectations</h2>
          <p class="lead-copy">Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam feugiat vitae ultricies eget tempor sit amet ante.</p>
          <div class="stats-row">
            <div><strong data-count="714" data-suffix="+">0+</strong><span>Listings Available</span></div>
            <div><strong data-count="48" data-suffix="%">0%</strong><span>Satisfaction Score</span></div>
            <div><strong data-count="12" data-suffix="/7">0/7</strong><span>Dedicated Support</span></div>
          </div>
          <div class="check-panel">
            <div><i class="bi bi-check"></i> Comprehensive market insights and valuation reports</div>
            <div><i class="bi bi-check"></i> Tailored property discovery based on your criteria</div>
            <div><i class="bi bi-check"></i> High-quality visuals and immersive virtual walkthroughs</div>
          </div>
          <div class="d-flex flex-wrap align-items-center gap-4 mt-4">
            <a href="#contact" class="btn btn-primary">Discover Our Story <i class="bi bi-arrow-right"></i></a>
            <div class="phone-help"><i class="bi bi-headset"></i><span>Questions?</span><strong>+1 (555) 321-4876</strong></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="properties" class="section muted-section">
    <div class="container-xl">
      <div class="section-title">
        <span>Featured Properties</span>
        <h2>Check Our <em>Featured Properties</em></h2>
      </div>
      <article class="spotlight-property">
        <img src="{{ $assetBase }}real-estate/property-exterior-4.webp" alt="Oceanfront estate">
        <div class="spotlight-body">
          <h3>Oceanfront Estate with Private Dock</h3>
          <p><i class="bi bi-geo-alt"></i> 328 Harbor Lane, Naples, FL 34102</p>
          <p>Donec sed odio dui maecenas faucibus mollis interdum, cras mattis consectetur purus sit amet fermentum etiam porta sem malesuada.</p>
          <div class="specs"><span><i class="bi bi-door-open"></i> 6 Beds</span><span><i class="bi bi-droplet"></i> 5 Baths</span><span><i class="bi bi-rulers"></i> 5,200 sq ft</span></div>
          <hr>
          <strong class="big-price">$4,150,000</strong>
          <div class="mt-3 d-flex gap-3"><a class="btn btn-primary" href="#contact">Schedule Tour</a><a class="btn btn-outline-secondary" href="#properties">Gallery</a></div>
        </div>
      </article>
      <div class="row g-4 mt-2">
        @foreach ([
          ['Trending', 'property-interior-5.webp', 'Downtown Luxury Apartment', 'Portland, OR 97201', '$725,000', '2', '2', '1,320 sq ft'],
          ['New', 'property-exterior-9.webp', 'Hillside Country Retreat', 'Asheville, NC 28801', '$615,000', '4', '3', '2,680 sq ft'],
          ['Featured', 'property-interior-3.webp', 'Panoramic Penthouse Suite', 'Chicago, IL 60611', '$1,480,000', '3', '3', '2,450 sq ft'],
          ['Exclusive', 'property-exterior-2.webp', 'Spacious Family Homestead', 'Boise, ID 83702', '$478,000', '5', '3', '3,100 sq ft'],
        ] as $property)
        <div class="col-sm-6 col-lg-3">
          <article class="property-card">
            <img src="{{ $assetBase }}real-estate/{{ $property[1] }}" alt="{{ $property[2] }}">
            <span class="card-tag">{{ $property[0] }}</span>
            <div class="p-3">
              <h3>{{ $property[2] }}</h3>
              <p><i class="bi bi-geo-alt"></i> {{ $property[3] }}</p>
              <div class="specs small-specs"><span>{{ $property[5] }}</span><span>{{ $property[6] }}</span><span>{{ $property[7] }}</span></div>
              <div class="d-flex justify-content-between align-items-center mt-3"><strong>{{ $property[4] }}</strong><a href="#contact">Explore <i class="bi bi-arrow-right"></i></a></div>
            </div>
          </article>
        </div>
        @endforeach
      </div>
      <div class="row g-4 mt-3">
        @foreach ([
          ['property-interior-8.webp', 'Renovated Studio in Arts District', 'Seattle, WA 98101', '$389,000', '1 Bed · 1 Bath · 780 sq ft'],
          ['property-exterior-7.webp', 'Modern Ranch with Open Floor Plan', 'Boulder, CO 80302', '$562,000', '3 Beds · 2 Baths · 2,100 sq ft'],
          ['property-interior-6.webp', 'Waterfront Condo with Balcony', 'Tampa, FL 33602', '$415,000', '2 Beds · 2 Baths · 1,150 sq ft'],
        ] as $small)
        <div class="col-lg-4">
          <article class="property-mini">
            <img src="{{ $assetBase }}real-estate/{{ $small[0] }}" alt="{{ $small[1] }}">
            <div><h3>{{ $small[1] }}</h3><p><i class="bi bi-geo-alt"></i> {{ $small[2] }}</p><strong>{{ $small[3] }}</strong> <span>{{ $small[4] }}</span></div>
          </article>
        </div>
        @endforeach
      </div>
    </div>
  </section>

  <section id="services" class="section muted-section">
    <div class="container-xl">
      <div class="section-title">
        <span>Featured Services</span>
        <h2>Check Our <em>Featured Services</em></h2>
      </div>
      <div class="row g-4">
        @foreach ([
          ['bi-search', 'Listing Discovery', 'Curabitur aliquet quam id dui posuere blandit nulla quis lorem ut libero malesuada feugiat praesent sapien', '01', ['Intelligent Filter Options', 'Immersive Virtual Walkthroughs', 'Instant Availability Alerts'], 'Browse Listings'],
          ['bi-graph-up-arrow', 'Valuation Insights', 'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae donec velit neque', '02', ['Neighborhood Price Tracking', 'Portfolio Growth Reports', 'Predictive Analytics'], 'View Reports'],
          ['bi-key', 'Rental Operations', 'Nulla porttitor accumsan tincidunt praesent sapien massa convallis a pellentesque nec egestas non nisi', '03', ['Occupant Background Checks', 'Automated Payment Tracking', 'Repair Coordination'], 'Start Managing'],
          ['bi-shield-check', 'Compliance Assistance', 'Mauris blandit aliquet elit eget tincidunt nibh pulvinar a pellentesque sit amet porttitor eget dolor morbi', '04', ['Agreement Evaluation', 'Ownership Validation', 'Regulatory Paperwork'], 'Discover More'],
        ] as $service)
        <div class="col-lg-6">
          <article class="service-box {{ $service[3] === '02' ? 'active' : '' }}">
            <span class="number">{{ $service[3] }}</span>
            <i class="bi {{ $service[0] }}"></i>
            <div>
              <h3>{{ $service[1] }}</h3>
              <p>{{ $service[2] }}</p>
              <div class="chips">@foreach ($service[4] as $chip)<span><i class="bi bi-check-circle"></i> {{ $chip }}</span>@endforeach</div>
              <a href="#contact">{{ $service[5] }} <i class="bi bi-arrow-right"></i></a>
            </div>
          </article>
        </div>
        @endforeach
      </div>
      <div class="text-center mt-5"><a class="btn btn-primary wide-btn" href="#contact">Explore Our Full Offerings <i class="bi bi-arrow-up-right"></i></a></div>
    </div>
  </section>

  <section id="agents" class="section muted-section pt-0">
    <div class="container-xl">
      <div class="section-title">
        <span>Featured Agents</span>
        <h2>Check Our <em>Featured Agents</em></h2>
      </div>
      @foreach ([
        ['Elite Agent', 'agent-3.webp', 'Sarah Mitchell', 'Premium Estates Consultant', 'Beverly Hills', '200', '+', 'Deals Closed', '4.9', 'Avg Rating', ['Penthouse', 'Luxury Villa']],
        ['Verified', 'agent-7.webp', 'David Nakamura', 'Industrial Realty Advisor', 'Midtown', '120', '+', 'Leases Signed', '4.7', 'Avg Rating', ['Warehouse', 'Commercial']],
        ['Newcomer', 'agent-9.webp', 'Elena Vasquez', 'Neighborhood Specialist', 'Lakewood', '60', '+', 'Satisfied Clients', '5.0', 'Avg Rating', ['Townhouse', 'Starter Home']],
      ] as $agent)
      <article class="agent-row">
        <div class="agent-photo"><img src="{{ $assetBase }}real-estate/{{ $agent[1] }}" alt="{{ $agent[2] }}"><span>{{ $agent[0] }}</span></div>
        <div class="agent-info"><h3>{{ $agent[2] }}</h3><p>{{ $agent[3] }}</p><small><i class="bi bi-geo-alt"></i> {{ $agent[4] }}</small></div>
        <div class="agent-stat"><strong data-count="{{ $agent[5] }}" data-suffix="{{ $agent[6] }}">0{{ $agent[6] }}</strong><span>{{ $agent[7] }}</span>@foreach ($agent[10] as $chip)<em>{{ $chip }}</em>@endforeach</div>
        <div class="agent-stat"><strong>{{ $agent[8] }}</strong><span>{{ $agent[9] }}</span></div>
        <div class="agent-actions"><div><button><i class="bi bi-telephone"></i></button><button><i class="bi bi-envelope"></i></button><button><i class="bi bi-whatsapp"></i></button></div><a class="btn btn-primary" href="#contact">View Profile</a></div>
      </article>
      @endforeach
      <div class="text-center"><a class="btn btn-outline-secondary wide-btn" href="#agents">Browse All Representatives <i class="bi bi-arrow-right"></i></a></div>
    </div>
  </section>

  <section id="testimonials" class="section white-section">
    <div class="container-xl">
      <div class="section-title">
        <span>Testimonials</span>
        <h2>Check Our <em>Testimonials</em></h2>
      </div>
      <article class="testimonial-card">
        <i class="bi bi-quote"></i>
        <div class="stars"><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i></div>
        <p>Proin iaculis purus consequat sem cure digni ssim donec porttitora entum suscipit rhoncus. Accusantium quam, ultricies eget id, aliquam eget nibh et. Maecen aliquam, risus at semper dignissimos.</p>
        <div class="person"><img src="{{ $assetBase }}person/person-m-7.webp" alt="Marcus Thornton"><div><strong>Marcus Thornton</strong><span>Product Manager</span></div></div>
      </article>
    </div>
  </section>

  <section id="why-us" class="section muted-section">
    <div class="container-xl">
      <div class="section-title">
        <span>Why Us</span>
        <h2>Check <em>Why Us</em></h2>
      </div>
      <div class="row g-4 align-items-start">
        <div class="col-lg-7">
          <span class="pill"><i class="bi bi-star-fill"></i> Trusted Real Estate Partner</span>
          <h2>Discover Unmatched Property Solutions Tailored for You</h2>
          <p class="lead-copy">Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Curabitur aliquet quam id dui posuere blandit. Nulla porttitor accumsan tincidunt.</p>
          <div class="row g-3">
            @foreach ([['bi-geo-alt', 'Strategic Locations', 'Curated neighborhoods with high demand and long-term value appreciation.'], ['bi-shield-check', 'Verified Listings', 'Every property undergoes thorough verification for your peace of mind.'], ['bi-lightning-charge', 'Rapid Closings', 'Efficient workflows and skilled negotiators to expedite every deal.'], ['bi-people', 'Dedicated Advisors', 'Accredited specialists committed to understanding your unique goals.']] as $reason)
            <div class="col-md-6"><div class="reason-card"><i class="bi {{ $reason[0] }}"></i><h3>{{ $reason[1] }}</h3><p>{{ $reason[2] }}</p></div></div>
            @endforeach
          </div>
          <div class="why-stats"><div><strong data-count="29" data-suffix="%">0%</strong><span>Client Satisfaction</span></div><div><strong data-count="620" data-suffix="+">0+</strong><span>Homes Delivered</span></div><div><strong data-count="7" data-suffix="/7">0/7</strong><span>Always Available</span></div></div>
          <div class="d-flex gap-3"><a class="btn btn-primary" href="#properties">Browse Listings</a><a class="btn btn-outline-secondary" href="#contact">Book a Meeting</a></div>
        </div>
        <div class="col-lg-5">
          <div class="why-media"><img src="{{ $assetBase }}real-estate/property-exterior-8.webp" alt="Resort property"></div>
          <div class="premium-box"><i class="bi bi-gem"></i><div><strong>Premium Service</strong><span>Bespoke property consulting since 2008</span></div></div>
          <div class="year-box"><strong>18+ Years</strong><span>4.5K Clients</span></div>
        </div>
      </div>
    </div>
  </section>

  <section id="contact" class="section muted-section pt-0">
    <div class="container-xl">
      <article class="cta-card">
        <div class="cta-image"><img src="{{ $assetBase }}real-estate/property-exterior-2.webp" alt="Modern estate"><span><i class="bi bi-star-fill"></i> Rated by 750+ Homeowners</span></div>
        <div class="cta-copy">
          <span class="pill">Begin Your Property Search</span>
          <h2>Discover Your Ideal Real Estate Opportunity</h2>
          <p>Curabitur aliquet quam id dui posuere blandit. Nulla porttitor accumsan tincidunt. Praesent sapien massa, convallis a pellentesque nec, egestas non nisi viverra.</p>
          <ul>
            <li><i class="bi bi-check"></i> Comprehensive neighborhood evaluations</li>
            <li><i class="bi bi-check"></i> Curated listings matched to your goals</li>
            <li><i class="bi bi-check"></i> Seamless closing coordination</li>
          </ul>
          <div class="d-flex flex-wrap gap-3 mt-4"><a class="btn btn-primary" href="mailto:info@example.com"><i class="bi bi-arrow-right"></i> Request a Consultation</a><a class="btn btn-outline-secondary" href="tel:+15559876543"><i class="bi bi-telephone"></i> Dial +1 (555) 987-6543</a></div>
        </div>
        <div class="cta-stats">
          <div><i class="bi bi-house-door"></i><strong data-count="920" data-suffix="+">0+</strong><span>Homes Closed</span></div>
          <div><i class="bi bi-award"></i><strong data-count="18">0</strong><span>Years in Business</span></div>
          <div><i class="bi bi-people"></i><strong data-count="98" data-suffix="%">0%</strong><span>Client Satisfaction</span></div>
        </div>
      </article>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="container-xl">
    <div class="row g-4">
      <div class="col-lg-4">
        <h2>LuxEstate</h2>
        <p>A108 Adam Street<br>New York, NY 535022</p>
        <p><strong>Phone:</strong> +1 5589 55488 55<br><strong>Email:</strong> info@example.com</p>
        <div class="footer-socials"><a href="#"><i class="bi bi-twitter-x"></i></a><a href="#"><i class="bi bi-facebook"></i></a><a href="#"><i class="bi bi-instagram"></i></a><a href="#"><i class="bi bi-linkedin"></i></a></div>
      </div>
      <div class="col-6 col-lg-2"><h3>Useful Links</h3><a href="#hero">Home</a><a href="#about">About us</a><a href="#services">Services</a><a href="#contact">Terms of service</a><a href="#contact">Privacy policy</a></div>
      <div class="col-6 col-lg-2"><h3>Our Services</h3><a href="#services">Web Design</a><a href="#services">Web Development</a><a href="#services">Product Management</a><a href="#services">Marketing</a><a href="#services">Graphic Design</a></div>
      <div class="col-6 col-lg-2"><h3>Hic solutasetp</h3><a href="#">Molestiae accusamus iure</a><a href="#">Excepturi dignissimos</a><a href="#">Suscipit distinctio</a><a href="#">Dilecta</a><a href="#">Sit quas consectetur</a></div>
      <div class="col-6 col-lg-2"><h3>Nobis illum</h3><a href="#">Ipsam</a><a href="#">Laudantium dolorum</a><a href="#">Dinera</a><a href="#">Trodelas</a><a href="#">Flexo</a></div>
    </div>
    <div class="footer-bottom">
      <p>&copy; Copyright <strong>LuxEstate</strong> All Rights Reserved</p>
      <p>Designed by <a href="https://bootstrapmade.com/">BootstrapMade</a></p>
    </div>
  </div>
</footer>

<a class="scroll-top" href="#hero" aria-label="Back to top"><i class="bi bi-arrow-up"></i></a>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="{{ asset('js/luxestate.js') }}"></script>
</body>
</html>
