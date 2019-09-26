from mountaintools import MountainClient
import spikeextractors as se
from .mdaextractors import MdaRecordingExtractor

class AutoRecordingExtractor(se.RecordingExtractor):
    def __init__(self, **kwargs):
        super().__init__()
        self._recording = None
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
            self._recording = MdaRecordingExtractor(timeseries_path=path, samplerate=samplerate)
            hash0 = self._client.sha1OfObject(dict(
                timeseries_path=self._client.computeFileSha1(path),
                samplerate=samplerate
            ))
            setattr(self, 'hash', hash0)
        else:
            raise Exception('Unsupported format for {}'.format(original_path))
    
    def get_channel_ids(self):
        return self._recording.get_channel_ids()

    def get_num_frames(self):
        return self._recording.get_num_frames()

    def get_sampling_frequency(self):
        return self._recording.get_sampling_frequency()

    def get_traces(self, **kwargs):
        return self._recording.get_traces(**kwargs)
