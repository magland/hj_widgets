# hj_widgets

Reactopya widgets specific to L. Frank's lab.

## General prerequisites

* Linux or OS X
* Python >= 3.6
* NodeJS >= 8
* Yarn

**Install reactopya**

```
pip install --upgrade reactopya
```

## Prerequisites for desktop

If you plan to run the GUI on the local computer (not the hosting method) then you will also need to install electron:

```
npm install -g electron
```

## Prerequisites for Jupyter

If you plan to use the widget in a notebook, then you should also install `reactopya_jup`:

```
pip install --upgrade reactopya_jup==0.7.4
```

For JupyterLab, install the lab extension:

```
jupyter labextension install reactopya_jup@0.7.4
```

For Jupyter Notebook, install and enable the notebook extension:

```
jupyter nbextension install --sys-prefix --py reactopya_jup
jupyter nbextension enable reactopya_jup --py --sys-prefix
```

## Installation

**Clone this repo**

```
git clone [this-repo]
```

**Install using reactopya**

```
cd [this-repo-name]
reactopya install-all
```

## Subsequent updates

```
cd [this-repo-name]
git pull
reactopya install-all
```

Periodically you may also need to upgrade reactopya or the jupyter extension (see above) since those are still in development.

## Usage

To visualize a single animal day in a desktop widget:

```
desktop_examples/view_animalday.py --raw /path/to/animalday/directory --processed /path/to/animalday/processed/directory
```

To host the visualization on a port:

```
desktop_examples/view_animalday.py --raw /path/to/animalday/directory --processed /path/to/animalday/processed/directory --port 6065
```

Then open browser to `http://localhost:6065` or if on a different machine `http://ip-address:6065`.

More information:

```
desktop_examples/view_animalday.py --help
```

You can also use this in a Jupyter notebook. See the `notebook_examples/` directory.

