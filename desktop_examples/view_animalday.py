#!/usr/bin/env python

import argparse
import hj_widgets as hj
hj.init_electron()


def main():
    parser = argparse.ArgumentParser(description="View a single animal day (Frank lab)")
    parser.add_argument('--raw', help='The raw input directory containing the animal day ephys, stimulus and behavior data', )
    parser.add_argument('--processed', help='The directory where the output of spike sorting have been written', required=False, default=None)
    parser.add_argument('--port', help='Port for hosting the view', required=False, default=None)
    args = parser.parse_args()
    props = dict(
        raw_path=args.raw,
        processed_path=args.processed
    )
    W = hj.AnimalDay(**props)
    if args.port:
        W.host(port=args.port)
    else:
        W.show()


if __name__ == '__main__':
    main()
