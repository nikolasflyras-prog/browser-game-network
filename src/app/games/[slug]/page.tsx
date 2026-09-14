import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameDiscovery } from "@/components/catalog/GameDiscovery";
import { GameHost } from "@/components/game/GameHost";
import { RunTheFed } from "@/components/game/RunTheFed";
import { getGameSeoContent } from "@/content/gameSeo";
import { getGameMetadata, gameRegistry } from "@/games/registry";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return gameRegistry.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameMetadata(slug);
  if (!game) return {};

  if (game.status === "diagnostic") {
    return {
      title: game.title,
      description: game.description,
      robots: { index: false, follow: false },
    };
  }

  const path = `/games/${game.slug}`;
  return {
    title: game.title,
    description: game.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: game.title,
      description: game.description,
      url: path,
    },
    twitter: {
      card: "summary",
      title: game.title,
      description: game.description,
    },
  };
}

export default async function GamePage({ params }: PageProps) {
  const { slug } = await params;
  const game = getGameMetadata(slug);
  if (!game) notFound();

  const seo = getGameSeoContent(game.slug);
  const isPublic = game.status !== "diagnostic";
  const structuredData = isPublic ? {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: game.title,
    description: game.description,
    url: absoluteUrl(`/games/${game.slug}`),
    applicationCategory: game.lane === "Learn" ? "EducationalApplication" : "GameApplication",
    operatingSystem: "Any modern web browser",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  } : null;

  return (
    <article className="game-page">
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      ) : null}

      <header className="game-heading">
        <div className="game-heading-meta">
          <p className="eyebrow">{game.lane}</p>
          <span className="category-label">{game.category}</span>
        </div>
        <h1>{game.title}</h1>
        <p>{game.description}</p>
      </header>

      {game.slug === "run-the-fed" ? <RunTheFed /> : <GameHost game={game} />}

      {seo ? (
        <div className="game-guide">
          <section className="content-section">
            <p className="eyebrow">Overview</p>
            <h2>How {game.title} works</h2>
            <p>{seo.summary}</p>
          </section>

          <section className="content-section">
            <h2>How to play</h2>
            <ol>
              {seo.howTo.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </section>

          <section className="content-section guide-columns">
            <div>
              <h2>{game.lane === "Learn" ? "Concepts in the simulation" : "Skills the game uses"}</h2>
              <ul>
                {seo.concepts.map((concept) => <li key={concept}>{concept}</li>)}
              </ul>
            </div>
            <div>
              <h2>Strategy</h2>
              <ul>
                {seo.strategy.map((tip) => <li key={tip}>{tip}</li>)}
              </ul>
            </div>
          </section>

          <section className="content-section">
            <h2>Frequently asked questions</h2>
            <div className="faq-list">
              {seo.faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="content-section">
          <h2>Engineering diagnostic</h2>
          <p>The System Check route validates the shared browser-game runtime and is intentionally excluded from public discovery and search indexing.</p>
        </section>
      )}

      <GameDiscovery game={game} />
    </article>
  );
}
