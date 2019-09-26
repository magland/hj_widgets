import os
import traceback
from spikeforest import SFMdaSortingExtractor
from spikeforest import mdaio
import sys


class AnimalDay:
    def __init__(self):
        super().__init__()

    def javascript_state_changed(self, prev_state, state):
        self._set_status('running', 'Getting state variables')
        raw_path = state.get('raw_path', None)
        if not raw_path:
            self._set_error('No raw path')
            return
        processed_path = state.get('processed_path', None)

        self._set_status('running', 'Loading epochs')

        # parse the epoch names from the input directory
        epoch_names = [name for name in sorted(os.listdir(raw_path)) if name.endswith('.mda')]
        # call load_epoch for each epoch name
        epochs = dict()
        for name in epoch_names:
            name0 = name[0:-4]
            if processed_path:
                epoch_processed_path = processed_path + '/' + name0
            else:
                epoch_processed_path = None
            epochs[name0] = load_epoch(raw_path + '/' + name, name=name0, processed_path=epoch_processed_path)

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


def load_epoch(path, *, name, processed_path=None):
    print('Loading epoch {}'.format(name))
    # read the ntrode names
    ntrode_names = [name for name in sorted(os.listdir(path)) if name.endswith('.mda')]
    print(ntrode_names)
    # load each of the ntrodes
    ntrodes = dict()
    for name2 in ntrode_names:
        print('Loading ntrode {}'.format(name2))
        name2b = name2[0:-4]
        if processed_path:
            ntrode_processed_path = processed_path + '/' + name2b
        else:
            ntrode_processed_path = None
        try:
            ntrodes[name2b] = load_ntrode(path + '/' + name2, name=name2b, epoch_name=name, processed_path=ntrode_processed_path)
        except:
            traceback.print_exc()
            print('WARNING: unable to load ntrode at {}'.format(path + '/' + name2))
    # here's the data representing the epoch
    return dict(
        type='epoch',
        path=path,
        processed_path=processed_path,
        name=name,
        ntrodes=ntrodes
    )

def load_ntrode(path, *, name, epoch_name, processed_path=None):
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

    processed_info = load_ntrode_processed_info(processed_path, recording_path=path, epoch_name=epoch_name, ntrode_name=name)

    # here's the structure for representing ntrode information
    return dict(
        type='ntrode',
        name=name,
        epoch_name=epoch_name,
        path=path,
        processed_path=processed_path,
        recording_file=path,
        geom_file=geom_file,
        num_channels=num_channels,
        num_timepoints=num_timepoints,
        samplerate=30000,  # fix this
        processed_info=processed_info
    )

def load_ntrode_processed_info(processed_path, *, recording_path, epoch_name, ntrode_name):
    if not processed_path:
        return None
    if not os.path.exists(processed_path):
        return None
    firings_path = processed_path + '/firings.mda'
    firings_curated_path = processed_path + '/firings_curated.mda'
    sorting_results = load_sorting_results_info(firings_path,recording_path=recording_path, epoch_name=epoch_name, ntrode_name=ntrode_name)
    sorting_results_curated = load_sorting_results_info(firings_curated_path, recording_path=recording_path, epoch_name=epoch_name, ntrode_name=ntrode_name, curated=True)
    return dict(
        sorting_results=sorting_results,
        sorting_results_curated=sorting_results_curated
    )

def load_sorting_results_info(firings_path, *, recording_path, epoch_name, ntrode_name, curated=False):
    if not os.path.exists(firings_path):
        return None
    sorting = SFMdaSortingExtractor(firings_file=firings_path)
    total_num_events = 0
    for unit_id in sorting.get_unit_ids():
        spike_times = sorting.get_unit_spike_train(unit_id=unit_id)
        total_num_events = total_num_events + len(spike_times)
    return dict(
        type='sorting_results',
        epoch_name=epoch_name,
        ntrode_name=ntrode_name,
        curated=curated,
        firings_path=firings_path,
        recording_path=recording_path,
        unit_ids=sorting.get_unit_ids(),
        num_events=total_num_events
    )