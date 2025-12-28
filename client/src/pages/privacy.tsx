import React from "react";
import { Container } from "../components/ui/container";
import { Separator } from "../components/ui/separator";

const PrivacyPolicy = () => {
  return (
    <Container className="py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">Last Updated: April 15, 2024</p>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to LOCKED ROOM ("we," "our," or "us"). We respect your privacy and are committed 
              to protecting your personal data. This privacy policy explains how we collect, use, process, 
              and share your information when you use our platform for locking SPL tokens and related services.
            </p>
            <p>
              LOCKED ROOM is a secure token locking platform powered by Solana smart contracts. By using our services, 
              you acknowledge that you have read and understand this privacy policy.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-2">2.1 Personal Information</h3>
            <p className="mb-4">
              We collect information that you provide directly to us when using LOCKED ROOM, including:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Wallet addresses and public keys</li>
              <li>Transaction data on the Solana blockchain</li>
              <li>Email address (if provided for notifications)</li>
              <li>Username (if created)</li>
            </ul>
            
            <h3 className="text-xl font-medium mb-2">2.2 Technical Information</h3>
            <p className="mb-4">
              We automatically collect certain information when you visit, use or navigate our platform:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Device and connection information (IP address, browser type, operating system)</li>
              <li>Usage data (pages visited, time spent, features used)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
            
            <h3 className="text-xl font-medium mb-2">2.3 Blockchain Information</h3>
            <p>
              Please note that any information you transmit through the Solana blockchain is publicly accessible 
              on the blockchain. This includes wallet addresses and transaction details. By design, blockchain 
              technology creates an immutable record, meaning this information cannot be changed or removed.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use your information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our platform services</li>
              <li>To process and complete token locking transactions</li>
              <li>To communicate with you about your account or transactions</li>
              <li>To send service-related notifications and updates</li>
              <li>To protect against fraudulent or unauthorized activity</li>
              <li>To improve and optimize our platform</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">4. Cookies and Tracking Technologies</h2>
            <p className="mb-4">
              We use cookies and similar tracking technologies to enhance your user experience and collect information about how you use our platform.
            </p>
            
            <h3 className="text-xl font-medium mb-2">4.1 Types of Cookies We Use</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Essential cookies:</strong> Required for basic functionality and security of the platform</li>
              <li><strong>Functional cookies:</strong> Enable enhanced functionality and personalization</li>
              <li><strong>Analytics cookies:</strong> Help us understand how visitors interact with our platform</li>
            </ul>
            
            <h3 className="text-xl font-medium mb-2">4.2 Your Cookie Choices</h3>
            <p>
              Most web browsers allow you to control cookies through their settings. However, refusing cookies may impact your experience and ability to use certain features of our platform.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">5. Information Sharing and Disclosure</h2>
            <p className="mb-4">We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service providers:</strong> Third-party companies that perform services on our behalf, such as hosting, analytics, and customer service</li>
              <li><strong>Compliance with laws:</strong> When required to comply with applicable laws, regulations, or legal processes</li>
              <li><strong>Protection of rights:</strong> When we believe it's necessary to investigate, prevent, or take action regarding potential violations of our policies, suspected fraud, or illegal activities</li>
            </ul>
            <p className="mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">6. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
            <p>
              While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security. Your use of Solana smart contracts for token locking provides additional security through the blockchain's inherent features.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">7. Your Rights and Choices</h2>
            <p className="mb-4">Depending on your location, you may have rights regarding your personal information, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Accessing and obtaining a copy of your data</li>
              <li>Rectifying inaccurate or incomplete information</li>
              <li>Requesting deletion of your personal information</li>
              <li>Restricting or objecting to processing of your information</li>
              <li>Data portability</li>
            </ul>
            <p className="mt-4">
              Please note that these rights may be limited in some circumstances, particularly regarding information permanently stored on the Solana blockchain blockchain, which cannot be altered or deleted due to the nature of blockchain technology.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">8. International Data Transfers</h2>
            <p>
              Our services operate globally and your information may be transferred to, and processed in, countries other than your country of residence. These countries may have data protection laws different from those in your country. By using our services, you consent to this transfer, storing, and processing.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">9. Children's Privacy</h2>
            <p>
              Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us to have it removed.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">10. Changes to This Privacy Policy</h2>
            <p>
              We may update this privacy policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. You are advised to review this policy periodically for any changes.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-2xl font-semibold text-[#9945FF] mb-4">11. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this privacy policy or our data practices, please contact us through the support channels available on our website.
            </p>
          </section>
        </div>
      </div>
    </Container>
  );
};

export default PrivacyPolicy; 