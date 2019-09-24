import React, { Component } from 'react';
import { Table, TableBody, TableRow, TableCell, TableHead, Link } from '@material-ui/core';

export default class EpochView extends Component {
    state = {}
    handleNtrodeClicked = (epochName, ntrodeName) => {
        this.props.onNtrodeClicked && this.props.onNtrodeClicked(epochName, ntrodeName)
    }
    render() {
        const { data } = this.props;
        let epochName = data.name;
        return (
            <div>
                <h3>Epoch: {data.name}</h3>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Ntrodes</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {
                            Object.entries(data.ntrodes).map(([ntrodeName, ntrode]) => (
                                <TableRow key={ntrodeName}>
                                    <TableCell>
                                        <Link2 onClick={() => this.handleNtrodeClicked(epochName, ntrodeName)}>
                                            {ntrodeName}
                                        </Link2>
                                    </TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
            </div>
        );
    }
}

function Link2(props) {
    return (
        <Link
            component="button" variant="body2"
            onClick={props.onClick}
        >
            {props.children}
        </Link>
    )
}