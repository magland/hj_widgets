from mountaintools import MountainClient
import spikeextractors as se
from .mdaextractors import MdaSortingExtractor

class AutoSortingExtractor(se.SortingExtractor):
    def __init__(self, **kwargs):
        super().__init__()
        self._sorting = None
        self._client = MountainClient()
        if 'download_from' in kwargs:
            self._client.configDownloadFrom(kwargs['download_from'])
        if 'path' in kwargs:
            path = kwargs['path']
            if self._client.isFile(path):
                file_path = self._client.realizeFile(path=path)
                if not file_path:
                    raise Exception('Unable to realize file: {}'.format(file_path))
                self._init_from_file(file_path, original_path=path, kwargs=kwargs)
            else:
                raise Exception('Not a file: {}'.format(path))
        else:
            raise Exception('Unable to initialize recording extractor')
    def _init_from_file(self, path: str, *, original_path: str, kwargs: dict):
        if original_path.endswith('.mda'):
            if 'samplerate' not in kwargs:
                raise Exception('Missing argument: samplerate')
            samplerate = kwargs['samplerate']
            self._sorting = MdaSortingExtractor(firings_file=path, samplerate=samplerate)
            hash0 = self._client.sha1OfObject(dict(
                firings_path=self._client.computeFileSha1(path),
                samplerate=samplerate
            ))
            setattr(self, 'hash', hash0)
        else:
            raise Exception('Unsupported format for {}'.format(original_path))
    
    def get_unit_ids(self):
        return self._sorting.get_unit_ids()

    def get_unit_spike_train(self, **kwargs):
        return self._sorting.get_unit_spike_train(**kwargs)
    
    def get_sampling_frequency(self):
        return self._sorting.get_sampling_frequency()