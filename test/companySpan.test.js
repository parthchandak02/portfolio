// Tenure lines and the glass behind each role (src/components/companySpan.js).
// CompanyCard shows these on every job and degree. Run with `npm test`.
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { endOf, loadCards, startOf } from '../scripts/cards.mjs';
import {
  companyLength,
  ends,
  lengthOf,
  monthOf,
  roleFill,
  roleLength,
} from '../src/components/companySpan.js';

const root = fileURLToPath(new URL('..', import.meta.url));

const roles = (...dates) => dates.map((date) => ({ item: { date } }));

const monthName = (index) =>
  [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ][index];

test('a month and year become months since year 0', () => {
  assert.equal(monthOf('January 2000'), 2000 * 12);
  assert.equal(monthOf('December 2000'), 2000 * 12 + 11);
  assert.equal(monthOf('October 2018'), 2018 * 12 + 9);
  assert.equal(monthOf('Oct 2018'), monthOf('October 2018'));
  assert.equal(monthOf('Oct. 2018'), monthOf('October 2018'));
  assert.equal(monthOf('  MAY 2018  '), 2018 * 12 + 4);
  assert.equal(monthOf('2018'), null);
  assert.equal(monthOf('May 2018 extra'), null);
  assert.equal(monthOf(''), null);
});

test('Present is the current month', () => {
  const now = new Date();
  assert.equal(monthOf('Present'), now.getFullYear() * 12 + now.getMonth());
  assert.equal(monthOf('present'), monthOf('Present'));
});

test('a range splits on the spaced hyphen, and a single date is both ends', () => {
  assert.deepEqual(ends('February 2022 - October 2026'), [
    'February 2022',
    'October 2026',
  ]);
  assert.deepEqual(ends('May 2018'), ['May 2018', 'May 2018']);
  assert.deepEqual(ends(''), ['', '']);
});

test('tenure counts both end months and pluralises the way the card does', () => {
  assert.equal(lengthOf('October 2018', 'January 2022'), '3 yrs 4 mos');
  assert.equal(lengthOf('February 2022', 'October 2026'), '4 yrs 9 mos');
  assert.equal(lengthOf('August 2016', 'May 2018'), '1 yr 10 mos');
  assert.equal(lengthOf('August 2015', 'May 2016'), '10 mos');
  assert.equal(lengthOf('June 2017', 'August 2017'), '3 mos');
  assert.equal(lengthOf('May 2018', 'August 2018'), '4 mos');
  assert.equal(lengthOf('June 2022', 'August 2022'), '3 mos');
  assert.equal(lengthOf('January 2018', 'December 2018'), '1 yr');
  assert.equal(lengthOf('January 2018', 'January 2019'), '1 yr 1 mo');
  assert.equal(lengthOf('January 2018', 'December 2019'), '2 yrs');
  assert.equal(lengthOf('May 2018', 'May 2018'), '1 mo');
  assert.equal(lengthOf('May 2018', 'June 2018'), '2 mos');
  assert.equal(lengthOf('August 2018', 'May 2018'), null);
  assert.equal(lengthOf('2016', '2018'), null);
});

test('a span that is still open runs through this month', () => {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const from = `${monthName(prev.getMonth())} ${prev.getFullYear()}`;
  assert.equal(lengthOf(from, 'Present'), '2 mos');
  assert.equal(lengthOf('October 2018', 'Present'), companyLength([
    { item: { date: 'October 2026 - Present' } },
    { item: { date: 'October 2018 - January 2022' } },
  ]));
});

test('only a range is given a tenure line', () => {
  assert.equal(roleLength('May 2018'), null);
  assert.equal(roleLength('May 2018 - August 2018'), '4 mos');
  assert.equal(roleLength('October 2026 - Present'), lengthOf('October 2026', 'Present'));
});

test('a later role that ended does not cut off an earlier role that ran longer', () => {
  // Newest start is listed first, the way the timeline passes roles. That role
  // can still finish before an earlier one, so the span is not "first end, last start".
  const ended = roles(
    'January 2024 - March 2024',
    'June 2022 - December 2025',
    'January 2020 - January 2021'
  );
  assert.equal(companyLength(ended), lengthOf('January 2020', 'December 2025'));
  const glass = roleFill(ended, 'June 2022 - December 2025');
  assert.ok(parseFloat(glass.left) >= 0);
  assert.ok(parseFloat(glass.left) + parseFloat(glass.width) <= 100.000001);

  const open = roles('March 2024 - June 2024', 'January 2020 - Present');
  assert.equal(companyLength(open), lengthOf('January 2020', 'Present'));
  const openGlass = roleFill(open, 'January 2020 - Present');
  assert.equal(openGlass.left, '0%');
  assert.equal(parseFloat(openGlass.width), 100);
});

test('one role fills the card and has no company total', () => {
  const tesla = roles('May 2018 - August 2018');
  assert.equal(companyLength(tesla), null);
  assert.deepEqual(roleFill(tesla, 'May 2018 - August 2018'), {
    left: '0%',
    width: '100%',
  });
});

test('a date with no month, or a company that lasts one month, fills the card', () => {
  assert.deepEqual(roleFill(roles('2018', '2016'), '2016'), {
    left: '0%',
    width: '100%',
  });
  assert.deepEqual(
    roleFill(roles('May 2018 - May 2018', 'May 2018 - May 2018'), 'May 2018 - May 2018'),
    { left: '0%', width: '100%' }
  );
});

test('glass shares the company years, and a short role stays visible', () => {
  // August 2015 through May 2018 is 34 months, counting both ends.
  const wsu = roles('August 2016 - May 2018', 'August 2015 - May 2016');
  assert.equal(companyLength(wsu), '2 yrs 10 mos');
  assert.deepEqual(roleFill(wsu, 'August 2015 - May 2016'), {
    left: '0%',
    width: '29.411764705882355%',
  });
  assert.deepEqual(roleFill(wsu, 'August 2016 - May 2018'), {
    left: '35.294117647058826%',
    width: '64.70588235294117%',
  });

  // January 2000 through December 2020. A one-month role at the end would
  // otherwise start past the right edge and shrink to a hairline.
  const long = roles(
    'December 2020 - December 2020',
    'January 2010 - December 2010',
    'January 2000 - January 2000'
  );
  assert.deepEqual(roleFill(long, 'December 2020 - December 2020'), {
    left: '94%',
    width: '6%',
  });
  assert.deepEqual(roleFill(long, 'January 2010 - December 2010'), {
    left: '47.61904761904761%',
    width: '6%',
  });
  assert.deepEqual(roleFill(long, 'January 2000 - June 2010'), {
    left: '0%',
    width: '50%',
  });
});

test('the portfolio roles keep the tenure and glass the page shows', () => {
  const { bySection } = loadCards(root);
  const cards = ['experience', 'education'].flatMap((id) => bySection[id]);
  const at = (category, company) =>
    cards
      .filter(
        (item) =>
          item.category === category &&
          item.company === company &&
          !item.parent
      )
      .sort(
        (a, b) => startOf(b.date) - startOf(a.date) || endOf(b.date) - endOf(a.date)
      )
      .map((item) => ({ item }));

  const zoox = at('experience', 'Zoox');
  assert.deepEqual(
    zoox.map((role) => role.item.title),
    [
      'Senior Creative Technologist',
      'Creative Technologist',
      'Manufacturing Engineer',
    ]
  );
  assert.equal(companyLength(zoox), lengthOf('October 2018', 'Present'));
  assert.equal(roleLength(zoox[1].item.date), '4 yrs 9 mos');
  assert.equal(roleLength(zoox[2].item.date), '3 yrs 4 mos');
  assert.equal(zoox[0].item.date.includes(' - '), true);

  const wsu = at('experience', 'Washington State University');
  assert.deepEqual(
    wsu.map((role) => role.item.title),
    ['Resident Technology Assistant', 'Resident Advisor']
  );
  assert.equal(companyLength(wsu), '2 yrs 10 mos');
  assert.equal(roleLength(wsu[0].item.date), '1 yr 10 mos');
  assert.equal(roleLength(wsu[1].item.date), '10 mos');
  assert.deepEqual(roleFill(wsu, wsu[1].item.date).left, '0%');
  assert.equal(
    parseFloat(roleFill(wsu, wsu[0].item.date).left) >
      parseFloat(roleFill(wsu, wsu[1].item.date).left),
    true
  );

  assert.equal(
    roleLength(
      at('experience', 'Tesla')[0].item.date
    ),
    '4 mos'
  );
  assert.equal(companyLength(at('experience', 'Tesla')), null);
  assert.equal(
    roleLength(at('experience', 'BERG Manufacturing')[0].item.date),
    '3 mos'
  );
  assert.equal(
    roleLength(at('education', 'UC Berkeley Extension')[0].item.date),
    '3 mos'
  );
  assert.equal(roleLength(at('education', 'WSU')[0].item.date), null);
});
