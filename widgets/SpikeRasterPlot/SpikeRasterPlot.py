from mountaintools import client as mt
from spikeforest import SFMdaSortingExtractor
import numpy as np

class SpikeRasterPlot:
    def __init__(self):
        super().__init__()

    def javascript_state_changed(self, prev_state, state):
        self._set_status('running', 'Running SpikeRasterPlot')
        firings_path = state.get('firings_path', None)
        if not firings_path:
            self._set_error('Missing: firings_path')
            return
        download_from = state.get('download_from', [])

        self._set_status('running', 'Realizing file')
        mt.configDownloadFrom(download_from)
        firings_path2 = mt.realizeFile(firings_path)
        if not firings_path2:
            self._set_error('Unable to realize file: {}'.format(firings_path))
        
        sorting = SFMdaSortingExtractor(firings_file=firings_path2)
        spike_trains = dict()
        for unit_id in sorting.get_unit_ids():
            spike_trains[int(unit_id)] = sorting.get_unit_spike_train(unit_id=unit_id)
        num_timepoints = np.max([
            np.max(spike_trains[unit_id])
            for unit_id in sorting.get_unit_ids()
        ])
        
        self._set_state(
            unit_ids=sorting.get_unit_ids(),
            spike_trains=spike_trains,
            num_timepoints=num_timepoints,
            status='finished',
            status_message='finished'
        )

    def _set_state(self, **kwargs):
        self.set_state(kwargs)
    
    def _set_error(self, error_message):
        self._set_status('error', error_message)
    
    def _set_status(self, status, status_message=''):
        self._set_state(status=status, status_message=status_message)