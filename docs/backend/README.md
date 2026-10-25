# MyShop Backend Design

২১ অক্টোবর ২০২৬ তারিখে বর্তমান রিপোজিটরি পর্যালোচনা করে তৈরি ব্যাকএন্ড ডিজাইন। ওয়েব স্টোর, অ্যাডমিন ড্যাশবোর্ড ও মোবাইল অ্যাপ একই API এবং একই ডেটাবেস ব্যবহার করবে। বর্তমান অ্যাপগুলো প্রিভিউ ও মক ডেটায় চলে; নিচের ব্যাকএন্ডটি প্রস্তাবিত, এখনো বাস্তবায়িত নয়।

প্রাথমিক সিদ্ধান্ত: **TypeScript ও NestJS দিয়ে modular monolith**, PostgreSQL-এ ব্যবসার মূল তথ্য, Redis ও BullMQ-তে ব্যাকগ্রাউন্ড কাজ এবং object storage-এ ছবি ও ইনভয়েস। API ও worker আলাদা process হবে, কিন্তু একই backend codebase ব্যবহার করবে।

**সরাসরি ডায়াগ্রাম দেখতে:** [Visual Architecture Atlas খুলুন](visual/index.html)। এখানে ৬৪টি টেবিল, ৯৭টি FK relation, column ও key inspector, index পরিকল্পনা, ১০টি architecture diagram এবং পুরো documentation এক পেজে আছে। পেজটি browser-এ offline-ও চলে।

## পড়ার ক্রম

| ডকুমেন্ট | বিষয় |
| --- | --- |
| [Project exploration](PROJECT-EXPLORATION.md) | বর্তমান তিনটি অ্যাপের ফিচার, কোডের প্রমাণ, সীমাবদ্ধতা ও integration points |
| [Backend system design](BACKEND-SYSTEM-DESIGN.md) | আর্কিটেকচার, module boundaries, checkout, stock, payment, return, security ও operations |
| [Database design](DATABASE-DESIGN.md) | entity, column, relation, constraint, index ও transaction rules |
| [API contract](API-CONTRACT.md) | endpoint inventory, access rules, request/response, error ও idempotency |
| [Implementation plan](IMPLEMENTATION-PLAN.md) | dependency অনুযায়ী কাজের ধাপ, client migration, tests ও launch criteria |
| [Architecture diagrams](diagrams/README.md) | সম্পাদনাযোগ্য Mermaid source ও rendered SVG diagrams |

## গুরুত্বপূর্ণ সিদ্ধান্ত

- পণ্যের প্রতিটি size এবং color combination-এর নিজস্ব `variantId`, SKU ও stock থাকবে।
- দাম, discount, shipping, tax ও order total সার্ভার নির্ধারণ করবে। UI-এর ১০% tax simulation production policy নয়।
- Checkout transaction একই সঙ্গে order তৈরি এবং stock reserve করবে। Online payment নিশ্চিত হবে provider verification থেকে।
- Customer শুধু নিজের order দেখতে পারবে। Admin ও Staff permission সার্ভার যাচাই করবে; login form থেকে role নির্বাচন করে privilege পাওয়া যাবে না।
- Return, cancellation, refund এবং payment status আলাদা থাকবে।
- প্রথম launch-এ single store, BDT এবং single warehouse ধরা হয়েছে। Provider, shipping rate, tax policy ও return window ব্যবসার সিদ্ধান্ত অনুযায়ী configure করতে হবে।

ইঞ্জিনিয়ারিং টিমের ব্যবহারের জন্য বিস্তারিত অংশগুলো English-এ লেখা হয়েছে। ফাইলের সব architecture ও capacity target প্রস্তাবিত; repository facts আলাদা করে exploration document-এ আছে।

## ডায়াগ্রাম দেখা

[Diagram gallery](diagrams/README.md) থেকে SVG খুললে অতিরিক্ত tool ছাড়াই diagram দেখা যায়। একই folder-এর `.mmd` ফাইল Mermaid editor-এ পরিবর্তন করা যায়।
