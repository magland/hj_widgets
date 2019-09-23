# hj_widgets

Reactopya widgets specific to L. Frank's lab.

## Installation

**Prerequisites**

* Linux or OS X
* Python >= 3.6
* NodeJS >= 8
* Yarn

If you plan to run the GUI on the local computer (not the hosting method) then you will also need to install electron:

```
npm install -g electron
```

**Install reactopya**

```
pip install --upgrade reactopya
```

**Clone this repo**

```
git clone [this-repo]
```

**Install using reactopya**

```
cd [this-repo-name]
reactopya install-all
```

## Usage

To visualize a single animal day:

```
desktop_examples/view_animalday.py --input /path/to/animalday/directory
```

To host the visualization on a port:

```
desktop_examples/view_animalday.py --input /path/to/animalday/directory --port 6065
```

Then open browser to `http://localhost:6065` or if on a different machine `http://ip-address:6065`.

More information:

```
desktop_examples/view_animalday.py --help
```

You can also use this in a jupyter notebook. See the `notebook_examples/` directory.

