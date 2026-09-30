/*
 * Static content pages (About, Privacy, Terms).
 *
 * These are real pages with real copy rather than dead links, and the copy is
 * written to match what this build actually does. Notably: there is no server,
 * so nothing is transmitted anywhere.
 */
const UPDATED = 'Last updated 1 September 2026';

const CONTENT = {
  about: {
    eyebrow: 'Our story',
    title: 'Clothing worth keeping',
    lede: "Bira's Collections began with a simple frustration: clothes that looked good for a week and fell apart by the third wash. We wanted the opposite.",
    sections: [
      {
        heading: 'Small runs, on purpose',
        body: [
          'We produce in limited quantities and restock only what actually sells. That keeps quality high, waste low, and means a piece you loved is more likely to still be available when you come back for it.',
          'When a run sells out, it may return. When a piece is retired, it is retired. We would rather tell you that than quietly reorder a worse version of the same thing.',
        ],
      },
      {
        heading: 'Materials that age well',
        body: [
          'Linen that softens with every wash. Leather that patinas instead of cracking. Cotton that holds its shape. We choose materials for their fifth year, not their first photograph.',
          'We are not a sustainable brand in the way that phrase is usually deployed. We are trying to make fewer things, better, and be honest about the trade-offs.',
        ],
      },
      {
        heading: 'A note on this site',
        body: [
          'This storefront is a working demonstration. There is no payment processor and no order database behind it — checkout stops at a confirmation screen and nothing is charged or shipped.',
          'Sign-in, the staff area, and the bag all run in your browser. Your data stays on this device.',
        ],
      },
    ],
  },

  privacy: {
    eyebrow: 'Legal',
    title: 'Privacy',
    lede: 'This site has no server, no analytics and no third-party tracking. That makes the policy short.',
    sections: [
      {
        heading: 'What stays on your device',
        body: [
          'Your bag, wishlist, language and sign-in state are stored in your browser using localStorage. They never leave this device and we cannot read them.',
          'Clearing your browser data for this site removes all of it permanently. There is no copy anywhere else.',
        ],
      },
      {
        heading: 'What is never collected',
        body: [
          'No analytics scripts. No advertising pixels. No third-party embeds. No IP logging, because there is nothing logging it.',
          'Fonts are loaded from Google Fonts, which means your browser makes a request to Google and Google sees your IP address. If you would rather avoid that, a system font fallback is applied.',
        ],
      },
      {
        heading: 'Accounts',
        body: [
          'Accounts on this build are created locally in your browser and are not real accounts. They carry no permissions beyond the role shown in the interface, and roles are not a security boundary here.',
          'Passwords entered on this site are stored only in your own browser. Please do not reuse a real password.',
        ],
      },
    ],
  },

  terms: {
    eyebrow: 'Legal',
    title: 'Terms of use',
    lede: 'By using this site you accept that it is a demonstration and not a live shop.',
    sections: [
      {
        heading: 'No real transactions',
        body: [
          'No order placed here is real. No payment is taken, no card or mobile-money account is charged, and nothing will be shipped to you.',
          'Any order number, tracking estimate or delivery window you see is illustrative only.',
        ],
      },
      {
        heading: 'Product information',
        body: [
          'Photographs, descriptions, prices, stock levels and ratings on this site are sample data. They may not reflect actual products or actual availability.',
          'Prices are shown in Ethiopian Birr. Nothing on this site constitutes an offer capable of acceptance.',
        ],
      },
      {
        heading: 'Liability',
        body: [
          'This site is provided as-is, for demonstration and evaluation. To the fullest extent permitted by law, we are not liable for any loss arising from its use.',
          'Intellectual property in the product photography and copy remains with its respective owners.',
        ],
      },
    ],
  },
};

export { CONTENT, UPDATED };
