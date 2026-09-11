const CACHE = "testapp-shell-f006357947848901";
const CACHE_PREFIX = "testapp-shell-";
const PRECACHE = [
  "/eretenkodaniil16-rgb/testapp/app-live/404.html",
  "/eretenkodaniil16-rgb/testapp/app-live/404/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/__next.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/OyGbxgxlc7Vsih1Q8-3__/_buildManifest.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/OyGbxgxlc7Vsih1Q8-3__/_clientMiddlewareManifest.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/OyGbxgxlc7Vsih1Q8-3__/_ssgManifest.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/00o-dv9d-cldc.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/0auuvegbh51t1.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/0cz1d0mv5g_q7.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/0g0aremvi8fa6.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/0nj3i2waifizf.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/0nuxljwt2h7wt.css",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/0u9y--nk_pcb9.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/104ovi27f0xk_.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/13d1o07dko3sk.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/19mx3mg6lkumu.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/1mh6a-0e61pyc.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/1w7nmgwkyzjeb.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/1yyehp0c9oe05.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/2qfq8f1jev-ns.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/310vm2bl3xxpt.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/3583olg27dmnb.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/3aaharapvx-62.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/3fntmmi971322.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/3ya0xz4wrzk1z.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/438r7aqxu8oc3.css",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/43ry6vmfvyvho.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_next/static/chunks/turbopack-34tq8u8vg4zfx.js",
  "/eretenkodaniil16-rgb/testapp/app-live/_not-found/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/_not-found/__next._not-found.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/_not-found/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/_not-found/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/_not-found/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/admin/import/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/admin/import/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/admin/import/__next.admin.import.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/admin/import/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/admin/import/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/app-version.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/manifest.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/general-surgery-antisepsis-chemical-biological.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/general-surgery-antisepsis-mechanical-physical.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/general-surgery-asepsis-airborne.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/general-surgery-asepsis-contact-implant.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/histology-core.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/histology-core.v2.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-dust-profpath.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-dust-profpath.v2.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-emf.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-emf.v2.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-microclimate.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-microclimate.v2.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-noise.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-noise.v2.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-optical.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-optical.v2.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-pressure.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-pressure.v2.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-prevention.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-prevention.v2.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-prevention.v3.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-ultrasound-infrasound.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-ultrasound-infrasound.v2.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-vibration.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-vibration.v2.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-work-physiology-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-work-physiology-a.v2.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-work-physiology-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/hygiene-work-physiology-b.v2.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pathology-core.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pathology-core.v2.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-adrenergic-classification-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-adrenergic-classification-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-adrenergic-clinical.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-adrenergic-effects-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-adrenergic-effects-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-adrenergic-mechanisms-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-adrenergic-mechanisms-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antianginal-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antianginal-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antianginal-c.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antianginal-d.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antiarrhythmics-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antiarrhythmics-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antibiotics-carbapenems-macrolides-aminoglycosides-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antibiotics-clinical-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antibiotics-mechanisms-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antibiotics-penicillins-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antibiotics-penicillins-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antibiotics-principles-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antibiotics-principles-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antibiotics-spectrum-adverse-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antibiotics-spectrum-adverse-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antibiotics-spectrum-resistance-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antibiotics-toxicity-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antidiabetic-agents-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antiepileptics-hypnotics-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antihypertensives-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antihypertensives-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antihypertensives-c.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antihypertensives-d.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-antihypertensives-e.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-asthma-pulmonary-edema.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-bronchodilators.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-cardiac-glycosides-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-cardiac-glycosides-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-cardiac-glycosides-c.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-cholinergic-classification-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-cholinergic-classification-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-cholinergic-clinical.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-cholinergic-effects-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-cholinergic-effects-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-cholinergic-mechanisms-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-cholinergic-mechanisms-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-cns-anesthesia-ethanol.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-digestive-antiemetic-antiulcer-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-digestive-antiulcer-choleretic-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-diuretics-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-diuretics-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-diuretics-c.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-general.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-glucocorticoids-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-glucocorticoids-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-glucocorticoids-c.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-gout-agents-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-gout-agents-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-hemostasis-anticoagulants-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-hemostasis-antiplatelets-fibrinolytics-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-hormonal-contraceptives-adverse.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-hormone-therapy-pituitary.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-insulin-metabolism-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-insulin-metabolism-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-lipid-lowering-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-lipid-lowering-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-nitrofurans-clinical-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-nitrofurans-interactions.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-nsaids-classification.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-nsaids-clinical.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-nsaids-mechanisms.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-opioid-analgesics.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-parkinsonism-epilepsy-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-parkinsonism-mechanisms.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-prolactin-oxytocin.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-psychotropics-classification-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-psychotropics-classification-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-psychotropics-classification-c.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-psychotropics-clinical-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-psychotropics-clinical-b1.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-psychotropics-clinical-b2.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-psychotropics-effects-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-psychotropics-effects-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-psychotropics-mechanisms-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-psychotropics-mechanisms-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-quinoxaline-nitroxoline-nitroimidazoles.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-respiratory-analeptics-antitussives.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-sex-hormones-anabolics-505-512.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-sex-hormones-anabolics-513-520.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-sex-hormones-anabolics-521-528.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-sex-hormones-anabolics-529-536.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-sex-hormones-anabolics-537-544.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-steroid-hormones-mineralocorticoids.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-sulfonamides-classification-local.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-sulfonamides-foundations-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-thyroid-parathyroid-a.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-thyroid-parathyroid-b.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-uterine-muscle-agents.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-vitamins-basic.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-vitamins-clinical.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/pharmacology-vitamins-requirements-mechanisms.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/physiology-core.v1.json",
  "/eretenkodaniil16-rgb/testapp/app-live/content/packages/physiology-core.v2.json",
  "/eretenkodaniil16-rgb/testapp/app-live/icon.svg",
  "/eretenkodaniil16-rgb/testapp/app-live/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/manifest.webmanifest",
  "/eretenkodaniil16-rgb/testapp/app-live/mistakes/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/mistakes/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/mistakes/__next.mistakes.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/mistakes/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/mistakes/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/practice/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/practice/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/practice/__next.practice.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/practice/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/practice/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/practice/setup/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/practice/setup/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/practice/setup/__next.practice.setup.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/practice/setup/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/practice/setup/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/questions/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/questions/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/questions/__next.questions.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/questions/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/questions/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/review/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/review/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/review/__next.review.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/review/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/review/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/settings/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/settings/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/settings/__next.settings.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/settings/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/settings/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/statistics/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/statistics/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/statistics/__next.statistics.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/statistics/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/statistics/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/general-surgery/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/general-surgery/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/general-surgery/__next.subjects.$d$subjectId.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/general-surgery/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/general-surgery/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/histology/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/histology/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/histology/__next.subjects.$d$subjectId.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/histology/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/histology/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/hygiene/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/hygiene/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/hygiene/__next.subjects.$d$subjectId.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/hygiene/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/hygiene/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/pathology/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/pathology/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/pathology/__next.subjects.$d$subjectId.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/pathology/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/pathology/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/pharmacology/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/pharmacology/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/pharmacology/__next.subjects.$d$subjectId.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/pharmacology/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/pharmacology/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/physiology/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/physiology/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/physiology/__next.subjects.$d$subjectId.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/physiology/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/subjects/physiology/index.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/weak-topics/__next._full.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/weak-topics/__next._tree.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/weak-topics/__next.weak-topics.__PAGE__.txt",
  "/eretenkodaniil16-rgb/testapp/app-live/weak-topics/index.html",
  "/eretenkodaniil16-rgb/testapp/app-live/weak-topics/index.txt"
];
const OFFLINE_ROOT = "/eretenkodaniil16-rgb/testapp/app-live/index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

async function navigationFallback(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const url = new URL(request.url);
  if (url.pathname.endsWith("/")) {
    const indexUrl = new URL(request.url);
    indexUrl.pathname += "index.html";
    const indexCached = await cache.match(indexUrl.toString(), { ignoreSearch: true });
    if (indexCached) return indexCached;
  }

  return (await cache.match(OFFLINE_ROOT)) || Response.error();
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      return response;
    }
    const fallback = await navigationFallback(request);
    if (fallback) return fallback;
    return response;
  } catch {
    return navigationFallback(request);
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }
  if (url.origin === self.location.origin) event.respondWith(cacheFirst(event.request));
});
