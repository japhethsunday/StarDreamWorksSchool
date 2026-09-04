export default function JsonLd() {
  const school = {
    "@context": "https://schema.org",
    "@type": "School",
    name: "STAR DreamWorks Schools",
    alternateName: "STAR DreamWorks",
    description:
      "A caring nursery, primary and junior secondary school in Ajah, Lagos, Nigeria, providing quality education from Creche through Secondary School.",
    url: "https://www.stardreamworksschools.com",
    logo: "https://www.stardreamworksschools.com/images/school-crest.jpg",
    image: "https://www.stardreamworksschools.com/images/school-crest.jpg",
    telephone: ["+2348038330066", "+2348023913673", "+2348080693316"],
    email: "",
    address: {
      "@type": "PostalAddress",
      streetAddress:
        "2, Sanmi Arewa Ara Street, Off Mobil Road, Oniseke Ilaje Bus-Stop",
      addressLocality: "Ajah",
      addressRegion: "Lagos",
      addressCountry: "NG",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 6.4698,
      longitude: 3.5852,
    },
    sameAs: [],
    hasMap: "",
    foundingDate: "",
    educationalLevel: [
      "Creche",
      "Kindergarten",
      "Nursery",
      "Primary School",
      "Secondary School",
    ],
    parentOrganization: {
      "@type": "Organization",
      name: "STAR DreamWorks Schools",
    },
    areaServed: {
      "@type": "Place",
      name: "Ajah, Lagos, Nigeria",
    },
    motto: "Education = Knowledge = Power = Respect = Happiness",
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "STAR DreamWorks Schools",
    url: "https://www.stardreamworksschools.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://www.stardreamworksschools.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.stardreamworksschools.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "About",
        item: "https://www.stardreamworksschools.com/about",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Academics",
        item: "https://www.stardreamworksschools.com/academics",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Admissions",
        item: "https://www.stardreamworksschools.com/admissions",
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "Gallery",
        item: "https://www.stardreamworksschools.com/gallery",
      },
      {
        "@type": "ListItem",
        position: 6,
        name: "News & Events",
        item: "https://www.stardreamworksschools.com/news",
      },
      {
        "@type": "ListItem",
        position: 7,
        name: "Contact",
        item: "https://www.stardreamworksschools.com/contact",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(school) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
    </>
  );
}
