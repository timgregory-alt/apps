import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions — Tennessee Wine Trails",
};

export default function TermsPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--color-gold)]">
          Tennessee Wine Trails
        </p>
        <h1 className="font-serif-display mt-1 text-2xl text-[var(--color-charcoal)]">
          Terms and Conditions
        </h1>
        <p className="mt-2 text-xs text-[var(--color-charcoal)]/50">Last updated August 20, 2026</p>
      </div>

      <div className="flex flex-col gap-5 text-sm leading-relaxed text-[var(--color-charcoal)]/80">
        <p>
          These Terms and Conditions (&ldquo;Terms&rdquo;) govern your access to and use of the
          Tennessee Wine Trails mobile app and website (the &ldquo;Service&rdquo;), operated by
          Tennessee Wine Trails (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By
          creating an account or otherwise using the Service, you agree to be bound by these
          Terms. If you do not agree, do not use the Service.
        </p>

        <Section title="1. Eligibility">
          <p>
            The Service helps guests plan visits to wineries that serve alcoholic beverages. You
            must be at least 21 years old to create an account, and we ask for your date of birth
            at signup to confirm this. The Service itself does not sell, serve, or deliver
            alcohol — all tastings, purchases, and service of alcohol happen directly between you
            and the winery you visit, subject to that winery&rsquo;s own policies and applicable
            law.
          </p>
        </Section>

        <Section title="2. Your Account">
          <p>
            You agree to provide accurate information when creating your account (including your
            name, email address, date of birth, and zip code) and to keep it up to date. You are
            responsible for safeguarding your password and for all activity under your account.
            Let us know right away if you suspect unauthorized use of your account.
          </p>
        </Section>

        <Section title="3. Location Services and Check-Ins">
          <p>
            The Service uses your device&rsquo;s location to verify winery check-ins — confirming
            you&rsquo;re physically at a winery before crediting a visit toward your trail
            progress and rewards. Location data is used only for this verification and related
            trail features. You can decline location permission, but check-in and related
            features won&rsquo;t work without it.
          </p>
        </Section>

        <Section title="4. Rewards, Points, and Redemptions">
          <p>
            The Service may award points for activity such as check-ins, wine ratings, referrals,
            and completing the trail, and may let you redeem points for rewards. Points have no
            cash value, cannot be transferred or sold, and may be adjusted, capped, or reset if we
            believe they were earned through fraud or abuse of the system. We may change the
            points structure, reward tiers, or discontinue the rewards program at any time. Some
            rewards are offered directly by us; others may depend on participation by individual
            wineries, which we do not control and cannot guarantee. We&rsquo;ll try to give
            reasonable notice of material changes where practical.
          </p>
        </Section>

        <Section title="5. Referrals">
          <p>
            If you refer another guest using your referral link or code, you may earn bonus
            points once they meet the qualifying criteria we set (for example, completing their
            first check-in). We may limit, adjust, or discontinue the referral program, or decline
            to credit a referral, if we reasonably suspect abuse.
          </p>
        </Section>

        <Section title="6. Ratings, Feedback, and Bug Reports">
          <p>
            You may submit wine ratings, app ratings, written feedback, and bug reports through
            the Service. By submitting content, you grant us a non-exclusive, royalty-free license
            to use it to operate, troubleshoot, and improve the Service. Don&rsquo;t submit
            anything false, abusive, or that infringes someone else&rsquo;s rights.
          </p>
        </Section>

        <Section title="7. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li>Falsify your location, age, or other account information</li>
            <li>Use automated tools (bots, scripts) to check in, submit ratings, or earn points</li>
            <li>Attempt to access another guest&rsquo;s account or personal information</li>
            <li>Interfere with or disrupt the Service or its underlying infrastructure</li>
            <li>Use the Service for any unlawful purpose</li>
          </ul>
        </Section>

        <Section title="8. Wineries Are Independent Businesses">
          <p>
            The wineries featured on the trail are independently owned and operated. We are not
            responsible for their hours, service, safety, alcohol service practices, pricing, or
            any incident that occurs on their premises. Your visit to any winery is subject to
            that winery&rsquo;s own rules and applicable law. Always drink responsibly and never
            drive under the influence.
          </p>
        </Section>

        <Section title="9. Intellectual Property">
          <p>
            The Service, including its design, text, graphics, and trail branding, is owned by us
            or our licensors and protected by intellectual property law. We grant you a limited,
            revocable, non-transferable license to use the Service for personal, non-commercial
            purposes.
          </p>
        </Section>

        <Section title="10. Disclaimer of Warranties">
          <p>
            The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express or
            implied. We don&rsquo;t guarantee the Service will be uninterrupted, error-free, or
            that location-based check-ins will always be accurate.
          </p>
        </Section>

        <Section title="11. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, we are not liable for any indirect,
            incidental, or consequential damages arising from your use of the Service, including
            any loss of points or rewards, or anything that happens during a winery visit.
          </p>
        </Section>

        <Section title="12. Termination">
          <p>
            We may suspend or terminate your account at our discretion, including for violating
            these Terms. You may stop using the Service and request account deletion at any time
            by contacting us.
          </p>
        </Section>

        <Section title="13. Changes to These Terms">
          <p>
            We may update these Terms from time to time. If we make material changes, we&rsquo;ll
            take reasonable steps to let you know (such as an in-app notice). Continued use of the
            Service after changes take effect means you accept the updated Terms.
          </p>
        </Section>

        <Section title="14. Governing Law">
          <p>
            These Terms are governed by the laws of the State of Tennessee, without regard to
            conflict-of-law principles.
          </p>
        </Section>

        <Section title="15. Contact">
          <p>Questions about these Terms? Reach out to us through the app&rsquo;s bug report or feedback form on your Profile page.</p>
        </Section>
      </div>

      <Link
        href="/"
        className="mt-2 text-sm font-medium text-[var(--color-burgundy)] hover:underline"
      >
        &larr; Back to Tennessee Wine Trails
      </Link>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-serif-display text-base text-[var(--color-charcoal)]">{title}</h2>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
