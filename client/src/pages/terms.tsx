import React from "react";
import { Container } from "../components/ui/container";
import { Separator } from "../components/ui/separator";

const TermsOfService = () => {
  return (
    <Container className="py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-6">Last Updated: April 15, 2024</p>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to LOCKED ROOM. These Terms of Service ("Terms") govern your access to and use of the LOCKED ROOM platform,
              including any associated website, applications, software, and services (collectively, the "Services") provided by LOCKED ROOM.
            </p>
            <p>
              By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms,
              you may not access or use the Services. Please read these Terms carefully before using the platform.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">2. Service Overview</h2>
            <p className="mb-4">
              LOCKED ROOM is a secure token locking platform powered by Solana smart contracts, designed to allow users to lock their SPL tokens
              and other assets for specified periods. Our platform utilizes the Solana blockchain and associated technologies to provide these services.
            </p>
            <p>
              We reserve the right to modify, suspend, or discontinue any aspect of our Services at any time, with or without notice.
              We are not liable to you or any third party for any modification, suspension, or discontinuation of the Services.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">3. User Accounts</h2>
            <p className="mb-4">
              To use certain features of the Services, you may need to connect your cryptocurrency wallet to our platform.
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Maintaining the security of your wallet's private keys</li>
              <li>All activities that occur under your connected wallet</li>
              <li>Ensuring that your use of the Services complies with these Terms and applicable laws</li>
            </ul>
            <p>
              You acknowledge that loss of your private keys may result in irreversible loss of access to any locked assets.
              LOCKED ROOM does not store your private keys and cannot assist in recovering them.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">4. Fees and Payments</h2>
            <p className="mb-4">
              LOCKED ROOM may charge fees for certain features or services. All applicable fees will be clearly displayed before you engage in any fee-based transaction.
            </p>
            <p className="mb-4">
              Fees, once paid, are non-refundable. All transactions on the Solana blockchain are irreversible once confirmed. 
              You are responsible for verifying all transaction details before confirming any transaction.
            </p>
            <p>
              The LOCKED token serves as a utility token within our ecosystem. 85% of platform fees are automatically distributed 
              to the top 100 LOCKED token holders, creating a sustainable revenue model for long-term holders.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">5. User Conduct</h2>
            <p className="mb-4">
              When using our Services, you agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable law, regulation, or contractual obligation</li>
              <li>Use the Services to engage in illegal activities, including money laundering, terrorist financing, or fraud</li>
              <li>Interfere with or disrupt the Services or servers or networks connected to the Services</li>
              <li>Attempt to access accounts or data that you are not authorized to access</li>
              <li>Submit false or misleading information</li>
              <li>Use any robot, spider, crawler, scraper, or other automated means to access the Services</li>
              <li>Introduce malware, viruses, or other harmful code to the platform</li>
              <li>Reverse engineer any portion of the Services</li>
            </ul>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">6. Intellectual Property</h2>
            <p className="mb-4">
              All content, features, and functionality of the Services, including but not limited to text, graphics, logos, icons, 
              images, audio clips, digital downloads, data compilations, and software, are the exclusive property of LOCKED ROOM
              or its licensors and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p>
              You may not copy, modify, distribute, sell, or lease any part of our Services or included software, nor may you reverse engineer 
              or attempt to extract the source code of that software, unless laws prohibit these restrictions or you have our written permission.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">7. Risk Disclosures</h2>
            <p className="mb-4">
              Using cryptocurrency services involves significant risks. By using our Services, you acknowledge and accept the following risks:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Price Volatility:</strong> Cryptocurrency prices can be extremely volatile and may fluctuate significantly during the locking period</li>
              <li><strong>Technical Risks:</strong> Blockchain technology is still evolving and may be subject to technical issues or vulnerabilities</li>
              <li><strong>Regulatory Uncertainty:</strong> Cryptocurrency regulations are evolving and may impact the availability or legality of our Services in certain jurisdictions</li>
              <li><strong>Smart Contract Risks:</strong> The Solana smart contracts and smart contracts that power our platform could contain bugs or vulnerabilities</li>
              <li><strong>Operational Risks:</strong> There may be periods of downtime or reduced functionality due to maintenance or technical issues</li>
            </ul>
            <p className="mt-4">
              You understand and agree that you use the Services at your own risk, and that LOCKED ROOM is not responsible 
              for any losses you may incur as a result of these risks.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">8. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOCKED ROOM AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AGENTS, AND LICENSORS WILL NOT
              BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS,
              DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your access to or use of or inability to access or use the Services</li>
              <li>Any conduct or content of any third party on the Services</li>
              <li>Any content obtained from the Services</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
              <li>Bugs, viruses, or other harmful code that may be transmitted through the Services</li>
              <li>Any direct or indirect losses arising from locking your tokens</li>
            </ul>
            <p className="mt-4">
              IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE AMOUNT YOU HAVE PAID TO 
              LOCKED ROOM FOR USE OF THE SERVICES IN THE PAST SIX MONTHS.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">9. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless LOCKED ROOM and its officers, directors, employees, agents, and licensors 
              from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) 
              that arise from or relate to your use or misuse of the Services, violation of these Terms, or violation of any rights of a third party.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">10. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. If we make changes to these Terms, we will provide notice of such changes 
              by updating the "Last Updated" date at the top of these Terms and by posting the revised Terms on our website. Your continued use of 
              the Services following the posting of revised Terms means that you accept and agree to the changes.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">11. Governing Law</h2>
            <p>
              These Terms and your use of the Services shall be governed by and construed in accordance with the laws of the State of California, 
              without giving effect to any choice or conflict of law provision or rule. Any legal suit, action, or proceeding arising out of, or 
              related to, these Terms or the Services shall be instituted exclusively in the federal courts of the United States or the courts 
              of the State of California, in each case located in San Francisco County.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">12. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum 
              extent necessary so that the Terms will otherwise remain in full force and effect and enforceable.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">13. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us through the support channels available on our website.
            </p>
          </section>
        </div>
      </div>
    </Container>
  );
};

export default TermsOfService; 