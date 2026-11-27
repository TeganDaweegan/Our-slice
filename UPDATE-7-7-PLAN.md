# Our Slice — Update 7.7: modular building and timber economy

Status: design agreed; implementation pending. This branch starts from tested Update 7.6 and does not alter the live game.

## Construction
- Build one 1-metre panel at a time rather than drawing complete rooms.
- Individual floor, wall, door and window panels, snapping to a grid.
- Panels purchased at Bunnings and kept in inventory until placed.
- Allow editing, removal and extension of individual panels.
- Improve mobile placement and building menus later.

## Timber
- Tap fallen timber in designated wooded areas to collect it.
- Fallen timber regenerates naturally over several in-game days.
- Living trees protected except in one designated managed logging area, where trees can be felled and regrow.
- Timber collected in pockets, transferred to HiAce storage, then sold to Bruce at Bunnings.
- Player chooses how much timber to sell.

## Inventory
- 10 pocket slots, each holding a stack of up to 100 identical items.
- Separate tool belt; tools do not occupy pocket slots.
- HiAce provides larger transport storage.

## Tools
- One reasonably durable quality of each tool, no tiers.
- Tools lose durability through use, cannot be repaired, and must eventually be replaced at Bunnings.

## Development sequence
1. Pocket stacks, HiAce storage and Bunnings sell/buy interface.
2. Individual 1m floor and wall panels with purchased stock.
3. Doors, windows, collision and editing.
4. Renewable fallen timber and managed logging area.
5. Tool belt, durability and replacement.
6. Isolated test page, mobile testing, save/restore and multiplayer validation.

Do not merge into main until tested and explicitly approved.
