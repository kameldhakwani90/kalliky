import Head from 'next/head';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
  ogImage?: string;
  schema?: object;
}

export function SEOHead({ title, description, canonical, keywords, ogImage, schema }: SEOProps) {
  const defaultTitle = "OrderSpot.pro - Assistant IA pour Restaurants";
  const fullTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  const defaultImage = ogImage || "https://orderspot.pro/images/og-image.jpg";

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={defaultImage} />
      <meta property="og:url" content={canonical || "https://orderspot.pro"} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="OrderSpot.pro" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={defaultImage} />
      
      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Schema.org JSON-LD */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      
      {/* Default Schema for SaaS */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "OrderSpot",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "Assistant IA pour restaurants qui prend les commandes téléphoniques automatiquement 24h/24",
            "url": "https://orderspot.pro",
            "author": {
              "@type": "Organization",
              "name": "OrderSpot",
              "url": "https://orderspot.pro"
            },
            "offers": {
              "@type": "Offer",
              "price": "129",
              "priceCurrency": "EUR",
              "name": "Plan Starter",
              "description": "Assistant IA pour restaurants - Plan Starter"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "150"
            }
          })
        }}
      />
    </Head>
  );
}