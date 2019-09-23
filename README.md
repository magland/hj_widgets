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

