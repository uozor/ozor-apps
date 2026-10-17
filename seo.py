# SEO / AI-search data shared by build.py. Free, no sign-up, in-browser claims are factual for every tool.
SHORT={'budget-calculator':'the budget calculator','tax-calculator':'the tax calculator','pdf-tools':'the PDF merge & split tool','image-compress':'the image compressor','image-convert':'the image converter','invoice':'the invoice generator','audio':'the audio trimmer','video-to-mp3':'the video to MP3 extractor','word-counter':'the word counter','password':'the password generator','biz-calc':'the business calculators','business-name':'the business name generator','email-signature':'the email signature generator','color-palette':'the color palette generator','qr-bio':'the QR code generator','meeting-cost':'the meeting cost calculator','policy':'the policy generator','resume':'the resume bullet improver'}
# path -> (title, meta description, applicationCategory)
META={
'budget-calculator/':('Free Monthly Budget Calculator & Planner (50/30/20), No Sign-Up | GWB','Plan a monthly budget free: income, expenses, what is left, % of income per category and a 50/30/20 comparison. Export PDF or Excel. No sign-up.','FinanceApplication'),
'':('Free Small Business Tools, No Sign-Up | GWB: Greater World Business','18 free online tools for small businesses and creators: merge PDF, compress images, invoice generator, calculators and more. No sign-up; files stay in your browser.','BusinessApplication'),
'tax-calculator/':('Free US Income Tax Calculator 2026: Take-Home Pay by State | GWB','Estimate 2026 federal and state income tax, Social Security, Medicare and take-home pay for all 50 states and DC. Free, private, no sign-up.','FinanceApplication'),
'pdf-tools/':('Merge PDF, Split PDF & JPG to PDF Free, No Sign-Up | GWB','Merge PDF files, split or extract pages, and convert JPG/PNG to PDF free. No sign-up, no watermark, no upload: everything runs in your browser.','BusinessApplication'),
'image-compress/':('Free Image Compressor & Resizer (JPG, PNG, WEBP), No Sign-Up | GWB','Compress and resize JPG, PNG and WEBP images free in your browser. No sign-up, no upload, no watermark and no file limits.','MultimediaApplication'),
'image-convert/':('Free Image Converter: PNG to JPG, JPG to PNG, WEBP, No Sign-Up | GWB','Batch-convert PNG, JPG and WEBP images free. No sign-up and no upload: images are converted privately in your browser.','MultimediaApplication'),
'invoice/':('Free Invoice Generator & Receipt Maker (PDF), No Sign-Up | GWB','Create professional invoices and receipts and save them as PDF free. No sign-up, no watermark, unlimited invoices, private in your browser.','BusinessApplication'),
'audio/':('Free Audio Trimmer & Ringtone Maker (MP3/WAV), No Sign-Up | GWB','Trim audio, add fade in/out and export MP3 or WAV ringtones free. No sign-up and no upload: your files never leave your device.','MultimediaApplication'),
'video-to-mp3/':('Free Video to MP3 Converter (MP4 to MP3), No Sign-Up | GWB','Extract the audio from your own MP4, WebM or MOV videos as MP3 or WAV free. No sign-up, no upload: converted privately in your browser.','MultimediaApplication'),
'word-counter/':('Free Word Counter & Character Counter, No Sign-Up | GWB','Count words, characters, sentences, paragraphs and reading time instantly, free. No sign-up; your text never leaves your browser.','UtilitiesApplication'),
'password/':('Free Strong Password Generator, No Sign-Up | GWB','Generate strong random passwords free with a cryptographically secure generator. No sign-up; passwords are created on your device and never stored.','SecurityApplication'),
'biz-calc/':('Free Profit Margin, Sales Tax, Loan & Break-Even Calculator | GWB','Free business calculators for profit margin and markup, sales tax, loan payments and break-even. No sign-up, instant results in your browser.','FinanceApplication'),
'business-name/':('Free Business Name Generator, No Sign-Up | GWB','Generate brandable business name ideas from your keywords in modern, classic, playful or tech styles. Free, unlimited, no sign-up.','BusinessApplication'),
'email-signature/':('Free Email Signature Generator for Gmail & Outlook, No Sign-Up | GWB','Create a professional HTML email signature for Gmail, Outlook or Apple Mail free. No sign-up, no branding added, copy and paste in seconds.','BusinessApplication'),
'color-palette/':('Free Color Palette Generator with Hex Codes, No Sign-Up | GWB','Generate harmonious brand color palettes free and copy hex codes or CSS variables. No sign-up; runs instantly in your browser.','DesignApplication'),
'qr-bio/':('Free QR Code Generator & Link-in-Bio Maker, No Sign-Up | GWB','Make QR code PNGs that never expire plus a one-file link-in-bio page, free. No sign-up, no tracking redirects, private in your browser.','DesignApplication'),
'meeting-cost/':('Free Meeting Cost Calculator & Live Timer, No Sign-Up | GWB','See what a meeting really costs with a free live timer based on attendees and hourly rates. No sign-up; runs in your browser.','BusinessApplication'),
'policy/':('Free Privacy Policy, Terms & Refund Policy Generator, No Sign-Up | GWB','Generate plain-English privacy policy, terms of service and refund policy drafts for your small business free. No sign-up required.','BusinessApplication'),
'resume/':('Free Resume Bullet Point Generator, No Sign-Up | GWB','Turn plain job duties into clear, quantified resume bullet points free. No sign-up; your text stays private in your browser.','BusinessApplication'),
}
# featureList per tool (factual, from the tool UIs)
FEATURES={
'budget-calculator':['Multiple income sources','Preset, editable expense categories','Monthly, weekly or annual amounts','Remaining or shortfall','Percent of income per category','50/30/20 comparison','Accessible bar chart','Optional save on this device'],
'tax-calculator':['2026 federal brackets and standard deduction (IRS)','All 50 states plus DC (Tax Foundation 2026)','Social Security and Medicare','Marginal and effective rate','Take-home pay per year, month, two weeks and week','Annual, monthly or hourly pay','Pre-tax 401(k)'],
'pdf-tools':['Merge multiple PDFs into one','Extract or split pages by range','Save each page as its own PDF','Convert JPG/PNG images to PDF','No upload: runs in the browser'],
'image-compress':['Compress JPG, PNG and WEBP','Resize by maximum width','Adjustable quality','Shows size savings','No upload: runs in the browser'],
'image-convert':['Convert between PNG, JPG and WEBP','Batch conversion','Background color for transparent areas','No upload: runs in the browser'],
'invoice':['Invoices and receipts','Line items, quantity, price and tax','Save as PDF','No watermark, unlimited documents'],
'audio':['Trim audio with start/end sliders','Fade in and fade out','Export MP3 or WAV','Ringtone length presets','No upload: runs in the browser'],
'video-to-mp3':['Extract audio from MP4, WebM or MOV','Export MP3 or WAV','Quality options','No upload: runs in the browser'],
'word-counter':['Word and character counts','Sentences and paragraphs','Reading and speaking time','Top keywords'],
'password':['Cryptographically secure randomness','Custom length and character sets','Strength estimate','Nothing stored'],
'biz-calc':['Profit margin and markup','Sales tax','Loan payment','Break-even analysis'],
'business-name':['Keyword-based name ideas','Modern, classic, playful and tech styles','Unlimited generations','Shortlist favorites'],
'email-signature':['HTML signature for Gmail, Outlook and Apple Mail','Accent color','One-click copy','No added branding'],
'color-palette':['Analogous, complementary and triadic harmonies','Random palettes','Copy hex codes','Copy CSS variables'],
'qr-bio':['QR code PNG download','Codes never expire (no redirect)','One-file link-in-bio page','No upload: runs in the browser'],
'meeting-cost':['Live meeting cost ticker','Hourly rate or annual salary','Yearly cost of recurring meetings'],
'policy':['Privacy policy drafts','Terms of service drafts','Refund policy drafts','Copy or download'],
'resume':['Action-verb bullet rewrites','Add numbers and results','Several verb styles','Copy bullets'],
}
EXPORTS={'budget-calculator':['PDF','Excel (.xlsx)','CSV'],'tax-calculator':['PDF','Excel (.xlsx)','CSV'],'biz-calc':['PDF','Excel (.xlsx)','CSV'],'meeting-cost':['PDF','Excel (.xlsx)','CSV'],'invoice':['PDF','Excel (.xlsx)','CSV'],'word-counter':['PDF','Excel (.xlsx)','CSV'],'color-palette':['PDF','Excel (.xlsx)','CSV'],'business-name':['PDF','Excel (.xlsx)','CSV'],'resume':['PDF','Excel (.xlsx)'],'policy':['PDF','Excel (.xlsx)'],'email-signature':['PDF','Excel (.xlsx)']}
def _fl(x): return ', '.join(x[:-1])+' or '+x[-1]
for _k,_x in EXPORTS.items(): FEATURES[_k]=FEATURES[_k]+['Export results to '+_fl(_x)+' (in-browser)','Send to phone as a plain-text note (share, copy, .txt or QR)']
def extra_faq(k,name):
    s=SHORT[k]; S=s[0].upper()+s[1:]
    return [(f"Is {s} free?",f"Yes. {S} is 100% free with no limits, no watermark and no paid tier."),
            ("Do I need an account or sign-up?","No. There is no account, sign-up or email required. Open the page and start using it.")]+([("Can I export or download my results?",f"Yes. Use Save results in the Free forever box to download your inputs and results as {_fl(EXPORTS[k])}, or tap Send to phone to share them as a plain-text note (share sheet, copy, .txt file or QR code). Files are created in your browser and include the date generated"+(". Tax year 2026, estimates only, not tax advice." if k=='tax-calculator' else "."))] if k in EXPORTS else [])
