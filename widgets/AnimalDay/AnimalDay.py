import os
from spikeforest import mdaio


class AnimalDay:
    def __init__(self):
        super().__init__()

    def javascript_state_changed(self, prev_state, state):
        self._set_status('running', 'Getting state variables')
        path = state.get('path', None)
        if not path:
            self._set_error('No path')
            return

        self._set_status('running', 'Loading epochs')

        # parse the epoch names from the input directory
        epoch_names = [name for name in sorted(os.listdir(path)) if name.endswith('.mda')]
        # call load_epoch for each epoch name
        epochs = dict()
        for name in epoch_names:
            name0 = name[0:-4]
            epochs[name0] = load_epoch(path + '/' + name, name=name0)

        self._set_status('running', 'Setting state')

        self.set_state(dict(
            object=dict(
                epochs=epochs
            ),
            status='finished',
            status_message='finished'
        ))
    
    def _set_error(self, error_message):
        self._set_status('error', error_message)
    
    def _set_status(self, status, status_message=''):
        self.set_state(dict(status=status, status_message=status_message))


def load_epoch(path, *, name):
    # read the ntrode names
    ntrode_names = [name for name in sorted(os.listdir(path)) if name.endswith('.mda')]
    # load each of the ntrodes
    ntrodes = dict()
    for name2 in ntrode_names:
        name2b = name2[0:-4]
        ntrodes[name2b] = load_ntrode(path + '/' + name2, name=name2b)
    # here's the data representing the epoch
    return dict(
        type='epoch',
        path=path,
        name=name,
        ntrodes=ntrodes
    )

def load_ntrode(path, *, name):
    # use the .geom.csv if it exists (we assume path ends with .mda)
    geom_file = path[0:-4] + '.geom.csv'
    if os.path.exists(geom_file):
        print('Using geometry file: {}'.format(geom_file))
    else:
        # if doesn't exist, we will create a trivial geom later
        geom_file = None
    
    X = mdaio.DiskReadMda(path)
    num_channels = X.N1()
    num_timepoints = X.N2()

    # here's the structure for representing ntrode information
    return dict(
        type='ntrode',
        name=name,
        path=path,
        recording_file=path,
        geom_file=geom_file,
        num_channels=num_channels,
        num_timepoints=num_timepoints,
        samplerate=30000  # fix this
    )