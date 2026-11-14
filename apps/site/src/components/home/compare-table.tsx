/**
 * "How AutoSort compares" table. Competitor cells stick to facts checked in November 2026
 * (see the shared brief); where the other apps differ, the cell says so and names examples.
 */

interface Row {
  feature: string;
  /** AutoSort has every feature in the table; this optional line adds the honest caveat or detail. */
  autosort?: string;
  smartReorder: string;
  others: string;
}

const ROWS: Row[] = [
  {
    feature: 'Free',
    autosort: 'The Spotify app owner needs Premium',
    smartReorder: 'No. Spotify Premium only',
    others: 'Varies. Sort Your Music and Sort by Tune are free; Skiley, PlaylistSorter and Free Your Music have paid plans',
  },
  {
    feature: 'Open source',
    autosort: 'MIT license',
    smartReorder: 'No',
    others: 'Varies. Sort Your Music is open source',
  },
  {
    feature: 'Self-hosted · data in your own database',
    smartReorder: 'No. Built into Spotify',
    others: 'No. Hosted web apps',
  },
  {
    feature: 'Splits one playlist into many',
    smartReorder: 'No. Reorders one playlist',
    others: 'No, in the apps we checked. They reorder one playlist',
  },
  {
    feature: 'Keeps playlists updated daily',
    autosort: 'Daily sync files new songs',
    smartReorder: 'No. A one-time reorder',
    others: "Mostly no. PlaylistSorter's paid Curator plan re-sorts hourly",
  },
  {
    feature: 'Harmonic (Camelot) sort',
    smartReorder: 'Partly. Reorders by BPM and key in Mix',
    others: 'Varies. Skiley, Sort by Tune and Free Your Music sort by Camelot key',
  },
];

export function CompareTable() {
  return (
    <div className="overflow-x-auto rounded-card border border-line">
      <table className="w-full min-w-[760px] border-collapse text-[15px]">
        <caption className="sr-only">AutoSort compared with Spotify Smart Reorder and other playlist sorter apps, as of November 2026</caption>
        <thead>
          <tr className="bg-surface-2 text-left">
            <th scope="col" className="w-[24%] px-[18px] py-3.5 font-bold text-text-2">
              Feature
            </th>
            <th scope="col" className="w-[20%] px-[18px] py-3.5 font-extrabold text-accent-soft">
              AutoSort
            </th>
            <th scope="col" className="w-[24%] px-[18px] py-3.5 font-bold">
              Spotify Smart Reorder
            </th>
            <th scope="col" className="px-[18px] py-3.5 font-bold">
              Other sorter apps
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.feature} className="border-t border-line align-top">
              <th scope="row" className="px-[18px] py-3.5 text-left font-semibold">
                {r.feature}
              </th>
              <td className="px-[18px] py-3.5">
                <span className="font-bold text-success-text">
                  <span aria-hidden="true">✓ </span>Yes
                </span>
                {r.autosort ? <span className="mt-0.5 block text-[13px] leading-[1.45] text-text-2">{r.autosort}</span> : null}
              </td>
              <td className="px-[18px] py-3.5 leading-[1.45] text-text-3">{r.smartReorder}</td>
              <td className="px-[18px] py-3.5 leading-[1.45] text-text-3">{r.others}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
