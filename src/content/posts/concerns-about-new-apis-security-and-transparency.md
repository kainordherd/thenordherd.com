---
title: Concerns about New API’s security and transparency
pubDate: '2026-04-28'
---

I am publishing this write-up because a security issue I reported to New API was fixed, but the handling around disclosure, attribution, and licensing raises broades. This is not meant to relitigate the technical patch itself. The vulnerability was real, it was fixed, and users were eventually told to upgrade. The problem is what happened around that fix: the advisory was delayed after the patch, the public credit did not reflect my understanding of the reporting history, and the project continues to present itself as open source while maintaining licensing practices that, in my view, deserve much closer scrutiny.

## A payment bypass in an infrastructure project

The issue was published as GHSA-xff3-5c9p-2mr4, a High severity vulnerability with a CVSS score of 7.1. In practical terms, the bug allowed payment bypass and unauthorized quota credit. New API exposed the Stripe webhook endpoint even when Stripe was not configured. When `StripeWebhookSecret` was empty, the webhook verification path still accepted events signed with an HMAC using the empty string as the key. At the same time, the checkout completion flow did not sufficiently verify that the referenced local top-up order was actually created for Stripe, nor did the recharge logic bind the callback source to the order’s real payment method.

The exploit chain was straightforward. A low-privilege authenticated user could create a pending top-up order through a non-Stripe payment flow, read the resulting `trade_no` from the top-up history UI, forge a `checkout.session.completed` event referencing that order, sign the payload with an empty webhook secret, and send it to `/api/stripe/webhook`. Once accepted, the server would mark the pending order as successful and credit quota even though no real payment had occurred. This was not a theoretical edge case. It was a direct billing integrity failure.

For a project like New API, this matters more than the CVSS number alone suggests. New API is not a toy package or a small personal script. It is an AI gateway and quota management system used to aggregate, distribute, and bill access to upstream model providers. A payment bypass in that context can translate directly into operator financial loss, corrupted accounting state, and fraudulent consumption of paid upstream resources.

## The silent-patch problem

According to the public release history, v0.12.10 was released on April 15. The public security advisory for GHSA-xff3-5c9p-2mr4 was published later, on April 22. I submitted my independent report on April 16 with a full root cause analysis and a working PoC. The team indicated that disclosure was being prepared, but the GHSA did not become public until days later.

That gap is the core disclosure problem. Once a security fix is shipped in a public repository, the vulnerability is no longer private in any meaningful sense. Attackers can compare releases, inspect the changed code, and reconstruct the bug. If users are not simultaneously told that a release contains a security fix, they are left exposed during the exact period when the bug becomes easier to rediscover.

This is especially risky when the release notes do not clearly say that the change is a security fix. A vague improvement note about Stripe payment processing is not the same as a security advisory telling operators that a payment bypass has been fixed and that they should upgrade immediately. For a billing-related vulnerability with a working exploit path, the difference matters.

Open-source maintainers do not need perfect enterprise security programs. But once a project reaches infrastructure scale and has tens of thousands of stars, it should have basic security response hygiene. A patch should be accompanied by a clear advisory, upgrade guidance, and a description of impact. If there is a reason to delay disclosure, the delay should be carefully justified. A silent patch followed by a delayed advisory creates an asymmetric window where attackers have more useful information than ordinary users.

## Attribution should be transparent

The second issue is attribution. In the final GHSA, I was listed as a coordinator, while another account was credited as the reporter. My report was submitted on April 16 and included a complete technical analysis, a practical reproduction path, and a working PoC. I was also told that I was the first non-maintainer to report the issue. The public advisory, however, credits another non-maintainer account as the reporter based on an earlier April 15 report.

I am not claiming that no earlier report existed. I do not have access to the private advisory history, and I cannot independently verify what was submitted before my report. But this is exactly why transparent attribution criteria matter. If an earlier report contained the same full vulnerability chain and exploitability analysis, then crediting that reporter may be reasonable. If the earlier report was partial, vague, or did not include a working exploit, then a complete independent report should at minimum be acknowledged as co-reporting rather than reduced to coordination.

Credit is not vanity in security research. It is part of the professional record. It affects trust, reputation, and the incentives that encourage researchers to responsibly disclose vulnerabilities instead of walking away. When a project changes or assigns roles in a GHSA without explaining the basis, it creates unnecessary suspicion and discourages future high-quality reporting.

I also reported a related medium-severity issue, GHSA-j489-9w5h-mmww, and at the time of writing I had not received a maintainer response for around eleven days. That lack of response adds to the concern that the project’s security process is not only slow in disclosure, but also inconsistent in communication with external researchers.

## Open source is not a shield against responsibility

There is another reason this case deserves attention. New API should not use the fact that it is an open-source project as a way to avoid responsibility. The project has the reach and operational role of infrastructure. It handles quota, payment flows, API access, and billing-sensitive logic. When such a project ships a payment bypass, the maintainers have a duty to communicate clearly and promptly with users. “This is open source” does not make delayed disclosure harmless, and it does not make opaque attribution acceptable.

That same accountability should also apply to licensing. New API states that it is based on One API, which is licensed under MIT. The New API project also acknowledges One API as its upstream base. MIT-licensed code can generally be incorporated into a project distributed under a stronger copyleft license, provided the MIT license and copyright notices are preserved. I am not objecting to that by itself. What concerns me is the broader licensing posture around New API’s own code, branding requirements, and commercial licensing.

New API currently presents the project as AGPLv3-licensed. The project has also previously described a usage-based dual licensing model: AGPLv3 by default, plus a commercial license for certain scenarios. In archived project documentation, the project stated that users must retain original branding, logos, and copyright statements when using only the AGPLv3 license, and that removing such branding requires a commercial license. The same documentation also stated that community contributions may be included in commercial-license distributions. I have not noticed any Contributor License Agreement or copyright assignment process that would clearly grant the project the right to relicense community contributions commercially beyond AGPLv3.

This matters because dual licensing is not magic. A project can dual-license code it owns. It can also dual-license contributions if contributors have explicitly granted the necessary rights, for example through a CLA or copyright assignment. But if outside contributors submit code only under AGPLv3, the maintainers do not automatically receive the right to redistribute those contributions under a separate proprietary commercial license. Without clear contributor consent, a dual-license model can become legally and ethically ambiguous.

The branding restriction is also troubling. An AGPL project may require preservation of appropriate legal notices and copyright attribution. That is different from saying that a user must pay a commercial license fee to modify or remove a user-interface footer or project branding in their own modified deployment. If the project tells users that changing the New API copyright notice in the website footer requires a commercial license, and that fee is around USD 5,000 per year, then this appears difficult to reconcile with the freedoms normally granted by AGPLv3. In my view, presenting the software as AGPL while imposing a paid restriction on ordinary modification of visible branding creates confusion at best and may be incompatible with the license at worst.

This is not legal advice, and I am not asking readers to treat this paragraph as a final legal conclusion. But the project should clarify the issue publicly. If the software is AGPLv3, users should know what they are actually allowed to modify. If there is a commercial license, contributors should know whether their code can be included in commercial distributions and what legal basis permits that. If the project believes its branding restriction is compatible with AGPLv3, it should explain that position clearly rather than leaving users to infer the rules from community statements and archived documentation.

## What I expect from a mature infrastructure project

The requests here are simple. Security patches should be disclosed with clear advisories when users need to take action. Release notes should not hide security-relevant fixes behind generic wording. Reporter attribution should be based on transparent criteria, especially when multiple people submitted related information. Outstanding reports should receive timely acknowledgements. Licensing terms should be clear, internally consistent, and respectful of both upstream authors and community contributors.

New API benefits from the trust of a large open-source community. That trust comes with obligations. A project cannot claim the legitimacy of open source when asking for community adoption, community testing, community reports, and community contributions, but then become opaque when the questions are about security credit, delayed disclosure, or commercial licensing rights.

I reported this vulnerability responsibly. I provided a full technical report and a working PoC. I waited for the project to fix and publish the advisory. I am now asking for the same thing many security researchers and users would ask from any widely deployed infrastructure project: transparency, fair attribution, timely communication, and a licensing model that does not use “open source” as branding while restricting the freedoms that open-source licenses are supposed to protect.
