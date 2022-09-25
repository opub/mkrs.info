# MKRS Info

Displays rank, sibling, price, owner and trait details about each of the NFTs in the [Based](https://getbased.com) MKRS collection on Solana. It supports basic filtering and sorting. It is designed to automatically adjust to additional traits as the MKRS levels up over time.

Clicking on a row shows a detailed view of the MKRS including the image and a link to any siblings if it happens to be a twin, trip, quad or quint. There are also links to the NFT's and owner's pages on MagicEden.

Owner and price details are updated hourly.



## Infrastructure

The site is hosted and the dynamically updated entirely within GitHub using [GitHub Pages](https://pages.github.com/) and [GitHub Actions](https://github.com/features/actions). GitHub Pages provides the static site hosting including SSL certificate. It also automatically deploys the updates once committed/merged to the main branch. The JSON data with current owner and price information is periodically updated using a scheduled job in GitHub Actions. This allows the data to be updated asynchronously while optimizing the site for user responsiveness.

## Donations

While there is no cost to operate the site on a daily basis there is quite a bit of time involved in the creation and feature improvement. If you have gotten some benefit from the site and wish to contribute to its upkeep feel free to send some SOL to: `givesome.sol`

## Contributions

I welcome issue reports, contributions and forked projects. While this was originally created for MKRS the vast majority of the code and functionality is applicable to any Solana NFT collection. The one feature that likely isn't needed for non-MKRS NFTs is the "sibling" determination and filtering.

## License

All source code in this repository is copyrighted by Ted O'Connor and licensed under the [GNU General Public License v3](./LICENSE.md).