#!/usr/bin/env python

import argparse
import hj_widgets as hj
hj.init_electron()


def main():
    parser = argparse.ArgumentParser(description="View a single animal day (Frank lab)")
    parser.add_argument('--input', help='The input directory containing the animal day ephys data', )
    parser.add_argument('--output', help='The output directory where the sorting results have been written', required=False, default=None)
    parser.add_argument('--port', help='Port for hosting the view', required=False, default=None)
    args = parser.parse_args()
    if args.output:
        raise Exception('Output directory not yet supported.')
    props = dict(
        path=args.input
    )
    W = hj.AnimalDay(**props)
    if args.port:
        W.host(port=args.port)
    else:
        W.show()


if __name__ == '__main__':
    main()
