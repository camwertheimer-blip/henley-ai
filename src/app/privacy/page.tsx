import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Henley AI",
  description: "Henley AI Privacy Policy",
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen text-[#e2e8f0]" style={{ background: "var(--bg)" }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#63b4ff] transition-colors mb-12"
        >
          <span>←</span>
          <span>Back to Henley AI</span>
        </Link>

        {/* Title */}
        <h1 className="font-display text-4xl md:text-5xl text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-[#94a3b8] mb-12">
          Effective Date: April 27, 2026 &nbsp;·&nbsp; Last Updated: April 27, 2026
        </p>

        {/* Body */}
        <div className="space-y-6 text-[15px] leading-relaxed text-[#cbd5e1]">
          <p>
            This Privacy Policy (&ldquo;Policy&rdquo;) describes how Henley Lord Holdings,
            a Delaware limited liability company, and its affiliates (collectively,
            &ldquo;Henley,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
            collect, use, disclose, retain, and protect information in connection with our
            website at henleyai.com (the &ldquo;Site&rdquo;), our litigation finance
            underwriting platform (the &ldquo;Platform&rdquo;), and related services
            (collectively, the &ldquo;Services&rdquo;).
          </p>

          <p>
            By accessing or using the Services, including by submitting any information
            through the Site or Platform, you (&ldquo;you,&rdquo; &ldquo;your,&rdquo; or
            &ldquo;Submitter&rdquo;) acknowledge that you have read, understood, and agree
            to this Policy. If you do not agree, do not use the Services.
          </p>

          <p>
            This Policy is incorporated by reference into Henley&rsquo;s Terms of Service
            (&ldquo;Terms&rdquo;) and the consent you provide when submitting a case. In
            the event of any conflict between this Policy and the Terms, the Terms shall
            control to the maximum extent permitted by applicable law.
          </p>

          <Section title="1. Scope and Applicability">
            <p>
              This Policy applies to all users of the Services, including prospective
              claimants, attorneys, law firms, investors, business contacts, and Site
              visitors, regardless of jurisdiction. We have drafted this Policy to comply
              with applicable U.S. federal and state privacy laws (including the
              California Consumer Privacy Act as amended by the California Privacy Rights
              Act (&ldquo;CCPA/CPRA&rdquo;), the California Online Privacy Protection Act
              (&ldquo;CalOPPA&rdquo;), the Colorado Privacy Act, the Virginia Consumer
              Data Protection Act, the Connecticut Data Privacy Act, the New York SHIELD
              Act, and the New York Department of Financial Services Cybersecurity
              Regulation 23 NYCRR Part 500 to the extent applicable) and, where
              applicable, the European Union and United Kingdom General Data Protection
              Regulation (collectively, &ldquo;GDPR&rdquo;).
            </p>
            <p>
              This Policy does not apply to information collected by third parties whose
              websites, products, or services may be linked to or integrated with the
              Services. Henley is not responsible for the privacy practices of such third
              parties.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p>We collect the following categories of information:</p>

            <SubSection title="2.1 Information You Provide Directly">
              <p>
                <strong className="text-white">Contact Information.</strong> Name, email
                address, telephone number, mailing address, employer, professional title,
                and similar identifiers.
              </p>
              <p>
                <strong className="text-white">Case Submission Information.</strong> Case
                narratives; jurisdiction; procedural posture; identification of and
                information regarding defendants, including financial profiles and asset
                information; damages estimates; funding requests; representation status;
                identifying information regarding counsel, law firms, and fee structures;
                counterclaim information; and any other information you elect to include
                in a submission.
              </p>
              <p>
                <strong className="text-white">Documents and Attachments.</strong> Any
                contracts, agreements, term sheets, demand letters, pleadings,
                correspondence, financial statements, expert reports, images, or other
                documents you upload, paste, or otherwise transmit through the Services.{" "}
                <strong className="text-white">
                  Such documents may contain information of, or relating to, third parties
                  (including opposing parties, witnesses, attorneys, and other
                  individuals), and you represent and warrant that you have the right to
                  share such information with us.
                </strong>
              </p>
              <p>
                <strong className="text-white">Communications.</strong> The contents of
                any messages, inquiries, or correspondence you send to us through the
                Site, by email, by telephone, or through other channels.
              </p>
            </SubSection>

            <SubSection title="2.2 Information We Collect Automatically">
              <p>
                <strong className="text-white">Technical and Usage Data.</strong> IP
                address; device identifiers; browser type and version; operating system;
                referring/exit pages; pages viewed; date and time of access; clickstream
                data; approximate geographic location derived from IP address; and similar
                telemetry.
              </p>
              <p>
                <strong className="text-white">
                  Cookies and Similar Technologies.
                </strong>{" "}
                We and our service providers may use cookies, web beacons, pixels, local
                storage, and similar technologies to operate the Services, analyze usage,
                and improve the Site. You may control cookies through your browser
                settings; disabling cookies may impair functionality of the Services.
              </p>
            </SubSection>

            <SubSection title="2.3 Information from Third Parties">
              <p>
                We may receive information about you from public records, court filings,
                business databases, credit and asset databases, regulatory filings,
                sanctions and watchlist providers, and other commercially available
                sources, in each case for purposes of underwriting, due diligence, fraud
                prevention, and compliance.
              </p>
            </SubSection>

            <SubSection title="2.4 Sensitive Information">
              <p>
                The Services are not intended for the collection of &ldquo;sensitive
                personal information&rdquo; as defined under CCPA/CPRA or &ldquo;special
                categories of personal data&rdquo; as defined under GDPR.{" "}
                <strong className="text-white">
                  You should not submit Social Security numbers, government identification
                  numbers, financial account numbers, payment card information, precise
                  geolocation, biometric data, health information, or information
                  regarding race, ethnicity, religion, political opinions, trade union
                  membership, sexual orientation, or criminal convictions, except to the
                  extent strictly necessary and directly relevant to your case submission.
                </strong>{" "}
                If you submit such information, you do so at your own discretion and
                consent to our processing of it for the purposes described in this Policy.
              </p>
            </SubSection>
          </Section>

          <Section title="3. How We Use Information">
            <p>
              We use the information we collect for the following purposes (which
              constitute, where required by GDPR, our legitimate interests, performance of
              a contract, or your consent):
            </p>
            <ol className="list-[lower-alpha] pl-6 space-y-2">
              <li>
                to evaluate, underwrite, and make decisions regarding potential litigation
                finance transactions;
              </li>
              <li>
                to communicate with you regarding your submission, your account, and the
                Services;
              </li>
              <li>
                to operate, maintain, secure, monitor, debug, and improve the Services;
              </li>
              <li>
                to develop, train, evaluate, and improve our internal models, processes,
                methodologies, and analytical frameworks (including by using submitted
                information in de-identified, aggregated, or anonymized form);
              </li>
              <li>
                to conduct research, analytics, and business intelligence regarding
                litigation trends, case outcomes, market conditions, and similar matters;
              </li>
              <li>
                to detect, investigate, and prevent fraud, misuse, abuse, security
                incidents, and unlawful activity;
              </li>
              <li>
                to comply with applicable laws, regulations, court orders, subpoenas, and
                lawful requests from governmental authorities;
              </li>
              <li>to enforce our Terms, this Policy, and any other agreements with you;</li>
              <li>to establish, exercise, or defend legal claims;</li>
              <li>
                to evaluate, negotiate, and complete corporate transactions, including
                financings, mergers, acquisitions, reorganizations, and asset sales; and
              </li>
              <li>
                for any other purpose disclosed to you at the time of collection or to
                which you consent.
              </li>
            </ol>
          </Section>

          <Section title="4. Artificial Intelligence and Automated Processing">
            <p>
              The Services use artificial intelligence and machine learning systems,
              including large language models provided by third parties (currently
              including Anthropic PBC), to analyze case submissions and generate
              underwriting outputs. By using the Services, you acknowledge and consent to
              such automated processing.
            </p>
            <p>
              <strong className="text-white">
                No Automated Decision-Making with Legal Effect.
              </strong>{" "}
              Outputs generated by automated systems are advisory only. No final funding
              decision is made solely on the basis of automated processing. All material
              decisions involve human review by Henley personnel.
            </p>
            <p>
              <strong className="text-white">Model Training.</strong> Submitted
              information may be used to train, evaluate, fine-tune, or improve
              Henley&rsquo;s proprietary models, processes, and methodologies, including
              in de-identified, aggregated, or anonymized form. We do not authorize our
              third-party AI providers to train their general-purpose models on your
              submissions, and we use such providers under contractual terms designed to
              prevent such training.
            </p>
            <p>
              <strong className="text-white">Limitations of AI Outputs.</strong>{" "}
              AI-generated outputs may contain errors, omissions, or inaccuracies. Such
              outputs are not legal advice, do not constitute a guarantee of outcome, and
              should not be relied upon as the sole basis for any decision.
            </p>
          </Section>

          <Section title="5. How We Disclose Information">
            <p>We may disclose information as follows:</p>

            <SubSection title="5.1 Affiliates and Personnel">
              <p>
                To our employees, officers, directors, members, managers, contractors,
                advisors, and affiliates who have a need to know in connection with the
                purposes described in this Policy.
              </p>
            </SubSection>

            <SubSection title="5.2 Service Providers and Sub-Processors">
              <p>
                To third-party service providers that perform services on our behalf,
                including:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong className="text-white">Anthropic PBC</strong> — large language
                  model and AI processing
                </li>
                <li>
                  <strong className="text-white">Google LLC</strong> — cloud document
                  storage, spreadsheet logging, and email infrastructure
                </li>
                <li>
                  <strong className="text-white">Vercel Inc.</strong> — website hosting
                  and serverless function execution
                </li>
                <li>
                  Analytics, monitoring, security, customer support, and similar providers
                </li>
              </ul>
              <p>
                We engage such providers under contractual terms that limit their use of
                information to providing services to us.
              </p>
            </SubSection>

            <SubSection title="5.3 Investors, Financing Sources, and Co-Investors">
              <p>
                To current and prospective investors, fund vehicles, financing sources,
                syndication partners, co-investors, and reinsurers, in each case for
                purposes of evaluating, structuring, or participating in transactions,
                subject to confidentiality obligations.
              </p>
            </SubSection>

            <SubSection title="5.4 Professional Advisors">
              <p>
                To our legal, financial, accounting, tax, regulatory, technical, and
                strategic advisors, and to insurers and auditors, in each case subject to
                confidentiality obligations (whether contractual, professional, or
                fiduciary).
              </p>
            </SubSection>

            <SubSection title="5.5 Counsel and Litigation Matters">
              <p>
                To attorneys, law firms, expert witnesses, litigation support vendors, and
                other parties involved in or relevant to a matter we are evaluating or
                have funded.
              </p>
            </SubSection>

            <SubSection title="5.6 Corporate Transactions">
              <p>
                In connection with any actual or proposed merger, acquisition, financing,
                reorganization, sale of assets, bankruptcy, or similar transaction,
                information may be transferred to counterparties and their advisors as
                part of due diligence or as a transferred asset.
              </p>
            </SubSection>

            <SubSection title="5.7 Legal and Regulatory">
              <p>
                To comply with applicable law, regulation, legal process, court order,
                subpoena, or lawful governmental request; to respond to claims; to enforce
                our rights and agreements; to protect the safety, rights, or property of
                Henley, our users, or others; and to investigate or prevent fraud,
                security incidents, or unlawful activity.
              </p>
            </SubSection>

            <SubSection title="5.8 With Your Consent">
              <p>To any other party with your consent or at your direction.</p>
            </SubSection>

            <SubSection title="5.9 De-Identified and Aggregated Information">
              <p>
                We may freely use, disclose, sell, license, or otherwise commercialize
                de-identified, aggregated, anonymized, or statistical information that
                does not identify you or any other individual.
              </p>
            </SubSection>

            <SubSection title="5.10 No Sale of Personal Information">
              <p>
                We do not &ldquo;sell&rdquo; personal information for monetary
                consideration in the traditional sense. We do not engage in
                &ldquo;cross-context behavioral advertising.&rdquo; Certain disclosures
                described above (such as to financing sources or in connection with
                corporate transactions) may constitute a &ldquo;sale&rdquo; or
                &ldquo;sharing&rdquo; under broad statutory definitions in CCPA/CPRA and
                similar laws; to the extent applicable, you may exercise the rights
                described in Section 9.
              </p>
            </SubSection>
          </Section>

          <Section title="6. Confidentiality, Privilege, and Work Product">
            <p>
              <strong className="text-white">Important.</strong> You are solely
              responsible for determining whether, and to what extent, submitting
              information to Henley may waive, impair, or otherwise affect any
              attorney-client privilege, work-product protection, common-interest
              privilege, joint-defense privilege, or other applicable confidentiality
              protection.
            </p>
            <p>
              By submitting information,{" "}
              <strong className="text-white">you represent and warrant that:</strong> (a)
              you are authorized to share the information; (b) your disclosure does not
              violate any confidentiality obligation owed to any third party; (c) you have
              considered the privilege and work-product implications of disclosure; and
              (d) to the extent you wish to preserve any privilege, you have entered or
              will enter into a separate written agreement with Henley addressing such
              matters.
            </p>
            <p>
              Henley does not undertake any obligation to preserve privilege or
              work-product protection over submitted information absent a separate written
              agreement.{" "}
              <strong className="text-white">
                No attorney-client relationship is formed by your use of the Services.
              </strong>
            </p>
          </Section>

          <Section title="7. Data Retention">
            <p>
              We retain information for as long as necessary to fulfill the purposes for
              which it was collected, including for the duration of our evaluation of a
              potential transaction, the life of any funded matter, and thereafter for
              periods consistent with our legitimate business interests, including:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>maintaining records of underwriting analyses and decisions;</li>
              <li>
                complying with legal, regulatory, tax, accounting, and audit obligations;
              </li>
              <li>
                defending against actual or potential legal claims (which may extend
                through applicable statutes of limitation and repose);
              </li>
              <li>
                preserving institutional knowledge for purposes of evaluating future
                submissions and improving our methodologies; and
              </li>
              <li>maintaining backup, archival, and disaster recovery systems.</li>
            </ul>
            <p>
              <strong className="text-white">
                We are not obligated to delete information following the conclusion of an
                evaluation or transaction.
              </strong>{" "}
              De-identified, aggregated, or anonymized information may be retained
              indefinitely.
            </p>
          </Section>

          <Section title="8. Security">
            <p>
              We maintain administrative, technical, and physical safeguards designed to
              protect information against unauthorized access, use, disclosure,
              alteration, and destruction, including measures responsive to the New York
              SHIELD Act and 23 NYCRR Part 500 to the extent applicable. Such measures
              include access controls, encryption in transit, secure credential
              management, and logging and monitoring.
            </p>
            <p>
              <strong className="text-white">
                However, no security measures are perfect or impenetrable, and we cannot
                guarantee the security of any information.
              </strong>{" "}
              Transmission of information to or from the Services is at your own risk. You
              are responsible for maintaining the confidentiality of any credentials used
              to access the Services and for the security of your own systems and
              networks.
            </p>
          </Section>

          <Section title="9. Your Rights">
            <p>
              Subject to applicable law and the exceptions and limitations described in
              this Policy, you may have the following rights with respect to your personal
              information:
            </p>
            <p>
              <strong className="text-white">Right to Know / Access.</strong> To request
              confirmation of whether we process your personal information and to receive
              a copy of such information.
            </p>
            <p>
              <strong className="text-white">Right to Correct.</strong> To request
              correction of inaccurate personal information.
            </p>
            <p>
              <strong className="text-white">Right to Delete.</strong> To request deletion
              of personal information, subject to exceptions including those described in
              Section 7.
            </p>
            <p>
              <strong className="text-white">Right to Opt Out.</strong> To opt out of any
              &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of personal information or of
              certain forms of automated processing, to the extent applicable.
            </p>
            <p>
              <strong className="text-white">Right to Portability.</strong> To request a
              copy of personal information in a portable format.
            </p>
            <p>
              <strong className="text-white">Right to Non-Discrimination.</strong> Not to
              be discriminated against for exercising your rights.
            </p>
            <p>
              <strong className="text-white">Right to Withdraw Consent.</strong> Where
              processing is based on consent, to withdraw such consent at any time
              (without affecting the lawfulness of prior processing).
            </p>
            <p>
              <strong className="text-white">
                GDPR-Specific Rights (where applicable).
              </strong>{" "}
              The right to object to processing, the right to restrict processing, and the
              right to lodge a complaint with a supervisory authority in your
              jurisdiction.
            </p>

            <SubSection title="9.1 How to Exercise Rights">
              <p>
                To exercise any of these rights, contact us at{" "}
                <a
                  href="mailto:info@henleyai.com"
                  className="text-[#63b4ff] hover:underline"
                >
                  info@henleyai.com
                </a>
                . We will respond within the time periods required by applicable law.
              </p>
            </SubSection>

            <SubSection title="9.2 Verification">
              <p>
                We may require you to verify your identity before responding to a request.
                We may decline requests that we cannot verify, that are manifestly
                unfounded or excessive, or that would be unduly burdensome, in each case
                to the extent permitted by applicable law.
              </p>
            </SubSection>

            <SubSection title="9.3 Authorized Agents">
              <p>
                You may designate an authorized agent to make a request on your behalf. We
                may require written authorization and verification of the agent&rsquo;s
                authority.
              </p>
            </SubSection>

            <SubSection title="9.4 Exceptions and Limitations">
              <p>
                Your rights are subject to exceptions under applicable law, including for
                information necessary to: complete a transaction, detect security
                incidents, comply with legal obligations, exercise or defend legal claims,
                conduct internal research, or as otherwise permitted by law. We will not
                delete information where retention is required or permitted under Section
                7.
              </p>
            </SubSection>

            <SubSection title="9.5 No Private Right of Action">
              <p>
                To the maximum extent permitted by applicable law, the rights described in
                this Section 9 are administrative in nature, and nothing in this Policy
                creates any private right of action against Henley.
              </p>
            </SubSection>
          </Section>

          <Section title="10. International Transfers">
            <p>
              Henley is based in the United States. If you access the Services from
              outside the United States, your information will be transferred to, stored
              in, and processed in the United States and other jurisdictions in which we
              or our service providers operate.{" "}
              <strong className="text-white">
                Such jurisdictions may not provide the same level of data protection as
                your home jurisdiction.
              </strong>{" "}
              By using the Services, you consent to such transfers.
            </p>
            <p>
              Where required by GDPR, we rely on Standard Contractual Clauses, adequacy
              decisions, or other lawful transfer mechanisms.
            </p>
          </Section>

          <Section title="11. Children">
            <p>
              The Services are not directed to, and we do not knowingly collect
              information from, individuals under 18 years of age. If you believe we have
              collected information from a minor, contact us at{" "}
              <a
                href="mailto:info@henleyai.com"
                className="text-[#63b4ff] hover:underline"
              >
                info@henleyai.com
              </a>{" "}
              and we will take appropriate action.
            </p>
          </Section>

          <Section title="12. California-Specific Disclosures">
            <p>This Section supplements this Policy and applies to California residents.</p>

            <SubSection title="12.1 Categories of Personal Information">
              <p>
                In the preceding 12 months, we have collected the following categories of
                personal information (as defined in CCPA/CPRA): identifiers; customer
                records; commercial information; internet or other electronic network
                activity information; geolocation data (approximate); professional or
                employment-related information; and inferences drawn from the foregoing.
              </p>
            </SubSection>

            <SubSection title="12.2 Sources, Purposes, and Disclosures">
              <p>
                The sources, purposes, and disclosures of such information are described
                in Sections 2, 3, and 5 of this Policy.
              </p>
            </SubSection>

            <SubSection title="12.3 Sale and Sharing">
              <p>
                We do not &ldquo;sell&rdquo; personal information for monetary
                consideration or engage in &ldquo;cross-context behavioral advertising.&rdquo;
                Disclosures to financing sources and in corporate transactions may, under
                broad statutory definitions, constitute a &ldquo;sale&rdquo; or
                &ldquo;sharing.&rdquo; You may opt out by contacting us at{" "}
                <a
                  href="mailto:info@henleyai.com"
                  className="text-[#63b4ff] hover:underline"
                >
                  info@henleyai.com
                </a>
                .
              </p>
            </SubSection>

            <SubSection title="12.4 Sensitive Personal Information">
              <p>
                We do not use or disclose sensitive personal information for purposes
                beyond those permitted under CCPA/CPRA Section 1798.121.
              </p>
            </SubSection>

            <SubSection title="12.5 Shine the Light">
              <p>
                California Civil Code Section 1798.83 entitles California residents to
                request information regarding our disclosure of personal information to
                third parties for direct marketing purposes. We do not disclose personal
                information for third-party direct marketing.
              </p>
            </SubSection>
          </Section>

          <Section title="13. Other State-Specific Disclosures">
            <p>
              Residents of Colorado, Connecticut, Virginia, Utah, Texas, Oregon, Montana,
              and other states with comprehensive privacy laws may have rights similar to
              those described in Section 9. Such residents may exercise their rights by
              contacting us at{" "}
              <a
                href="mailto:info@henleyai.com"
                className="text-[#63b4ff] hover:underline"
              >
                info@henleyai.com
              </a>
              . Where applicable law provides for an appeal of our response, you may
              appeal by replying to our response within the time period specified in our
              response.
            </p>
          </Section>

          <Section title="14. Do Not Track">
            <p>The Services do not respond to &ldquo;Do Not Track&rdquo; browser signals.</p>
          </Section>

          <Section title="15. Third-Party Links and Services">
            <p>
              The Services may contain links to or integrations with third-party websites
              and services. We are not responsible for the privacy practices of such third
              parties. We encourage you to review their privacy policies before providing
              them with information.
            </p>
          </Section>

          <Section title="16. Changes to this Policy">
            <p>
              We may update this Policy from time to time. The &ldquo;Last Updated&rdquo;
              date at the top reflects the date of the most recent revision.{" "}
              <strong className="text-white">
                Material changes will be communicated by posting the revised Policy on the
                Site, and your continued use of the Services following the effective date
                of any revision constitutes your acceptance of the revised Policy.
              </strong>{" "}
              We encourage you to review this Policy periodically.
            </p>
          </Section>

          <Section title="17. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable law, in no event shall Henley,
              its affiliates, or its or their respective officers, directors, members,
              managers, employees, agents, advisors, or service providers be liable for
              any indirect, incidental, special, consequential, exemplary, or punitive
              damages, or any loss of profits, revenue, data, or goodwill, arising out of
              or relating to this Policy, the Services, or any use or disclosure of
              information, regardless of the theory of liability and even if Henley has
              been advised of the possibility of such damages. Our aggregate liability
              arising out of or relating to this Policy shall not exceed one hundred U.S.
              dollars ($100). The foregoing limitations apply to the maximum extent
              permitted by applicable law and do not apply to liability that cannot be
              limited or excluded under applicable law.
            </p>
          </Section>

          <Section title="18. Governing Law; Dispute Resolution">
            <p>
              This Policy, and any dispute arising out of or relating to it, shall be
              governed by the laws of the State of Delaware, without regard to its
              conflict of laws principles. Any dispute arising out of or relating to this
              Policy shall be resolved exclusively in accordance with the dispute
              resolution provisions set forth in Henley&rsquo;s Terms of Service,
              including any arbitration and class-action waiver provisions therein.
            </p>
          </Section>

          <Section title="19. Severability; No Waiver; Entire Agreement">
            <p>
              If any provision of this Policy is held to be invalid or unenforceable, the
              remaining provisions shall continue in full force and effect. Our failure to
              enforce any provision shall not constitute a waiver. This Policy, together
              with the Terms and any other agreements between you and Henley, constitutes
              the entire agreement between you and Henley regarding the subject matter
              hereof.
            </p>
          </Section>

          <Section title="20. Contact">
            <p>
              For questions, concerns, or requests regarding this Policy or our privacy
              practices, contact us at:
            </p>
            <p className="text-white">
              Henley Lord Holdings, LLC
              <br />
              131 Continental Drive, Suite 305
              <br />
              Newark, DE 19713
              <br />
              USA
              <br />
              Email:{" "}
              <a
                href="mailto:info@henleyai.com"
                className="text-[#63b4ff] hover:underline"
              >
                info@henleyai.com
              </a>
            </p>
          </Section>

          <p className="text-xs text-[#94a3b8] pt-12 border-t border-white/5">
            © 2026 Henley Lord Holdings, LLC. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}

/* ─── Helper components ─── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-8 space-y-4">
      <h2 className="font-display text-2xl text-white">{title}</h2>
      {children}
    </section>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pt-2 space-y-3">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}