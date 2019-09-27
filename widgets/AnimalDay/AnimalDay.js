import React, { Component } from 'react';
import { PythonInterface } from 'reactopya';
import BrowserTree, { TreeData } from './BrowserTree/BrowserTree';
import EpochView from './EpochView';
import NtrodeView from './NtrodeView';
import SortingResultsView from './SortingResultsView';
import config from './AnimalDay.json';
import './AnimalDay.css';
import Draggable from 'react-draggable';
import AutoDetermineWidth from '../jscommon/AutoDetermineWidth';

export default class AnimalDay extends Component {
    static title = 'View of ephys data for a single animal day'
    static reactopyaConfig = config
    render() {
        return (
            <AutoDetermineWidth>
                <AnimalDayInner {...this.props} />
            </AutoDetermineWidth>
        );
    }
}

class AnimalDayInner extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // javascript state
            raw_path: null,
            processed_path: null,

            // python state
            status: '',
            status_message: '',
            object: null,

            // other
            selectedNodeData: null,
            selectedNodePath: null
        }
        this.treeData = new TreeData;
    }
    componentDidMount() {
        this.pythonInterface = new PythonInterface(this, config);
        this.pythonInterface.setState({
            raw_path: this.props.raw_path || this.props.path,  // TODO: allow path for backward compatibility (eventually remove)
            processed_path: this.props.processed_path
        });
        this.pythonInterface.start();
    }
    componentDidUpdate() {
        if ((this.state.object) && (this.props.init_selected_node_path) && (!this.state.selectedNodePath)) {
            this.selectNodeFromPath(this.props.init_selected_node_path);
        }
    }
    componentWillUnmount() {
        this.pythonInterface.stop();
    }
    onItemSelected = (item) => {
        if ((item) && (item.data.object) && (item.data.object.type)) {
            this.setState({
                selectedNodeData: item.data.object
            });
        }
    }
    handleNtrodeClicked = (epochName, ntrodeName) => {
        this.selectNodeFromPath(`epochs/${epochName}/ntrodes/${ntrodeName}`);
    }
    selectNodeFromPath = (path) => {
        let list = path.split('/');
        let ptr = this.state.object;
        for (let val of list) {
            if (ptr) {
                ptr = ptr[val];
            }
        }
        if (ptr) {
            this.setState({
                selectedNodeData: ptr,
                selectedNodePath: path
            });
        }
        else {
            console.warn('Unable to select node from path: ' + path);
        }
    }
    handleViewSortingResults = (epochName, ntrodeName) => {
        this.selectNodeFromPath(`epochs/${epochName}/ntrodes/${ntrodeName}/processed_info/sorting_results`);
    }
    handleViewSortingResultsCurated = (epochName, ntrodeName) => {
        this.selectNodeFromPath(`epochs/${epochName}/ntrodes/${ntrodeName}/processed_info/sorting_results_curated`);
    }
    render() {
        console.log('------', this.state.object, this.props);
        let content = (
            <ADContainer width={this.props.width} height={500}>
                <BrowserTree
                    path={null}
                    object={this.state.object}
                    treeData={this.treeData}
                    selectedNodePath={this.state.selectedNodePath}
                    onItemSelected={this.onItemSelected}
                    pathHistory={null}
                    onGotoHistory={null}
                    kacheryManager={null}
                />
                <ContentView
                    data={this.state.selectedNodeData}
                    onNtrodeClicked={this.handleNtrodeClicked}
                    onViewSortingResults={this.handleViewSortingResults}
                    onViewSortingResultsCurated={this.handleViewSortingResultsCurated}
                    reactopyaParent={this}
                />
            </ADContainer>
        )
        // let content = (
        //     <Grid container spacing={3}>
        //         <Grid item xs={12} md={6} lg={4} xl={3}>
        //             <BrowserTree
        //                 path={null}
        //                 object={this.state.object}
        //                 treeData={this.treeData}
        //                 selectedNodePath={this.state.selectedNodePath}
        //                 onItemSelected={this.onItemSelected}
        //                 pathHistory={null}
        //                 onGotoHistory={null}
        //                 kacheryManager={null}
        //             />
        //         </Grid>
        //         <Grid item xs={12} md={6} lg={8} xl={9}>
        //             <ContentView
        //                 data={this.state.selectedNodeData}
        //                 onNtrodeClicked={this.handleNtrodeClicked}
        //                 reactopyaParent={this}
        //             />
        //         </Grid>
        //     </Grid>
        // );
        return (
            <RespectStatus {...this.state}>
                {content}
            </RespectStatus>
        )
    }
}

class ADContainer extends Component {
    constructor(props) {
        super(props);
        this.state={
            gripPosition: null
        };
        this.actualGripPosition = null;
    }
    componentDidMount() {
    }
    componentDidUpdate() {
    }
    componentWillUnmount() {
    }
    _handleGripDrag = (evt, ui) => {
        console.log('--- drag', evt, ui);
    }
    _handleGripDragStop = (evt, ui) => {
        console.log('--- stop', evt, ui);
        const newGripPosition = ui.x;
        this.setState({
            gripPosition: newGripPosition
        });
    }
    render() {
        console.log('-abcc', this.props);
        const { width, height } = this.props;
        let { gripPosition } = this.state;

        if (gripPosition === null) {
            gripPosition = 300;
        }
        console.log('--- grip position is', gripPosition);
        this.actualGripPosition = gripPosition;
        const gripWidth = 12;
        const width1 = gripPosition;
        const width2 = width - width1 - gripWidth;

        let child1 = this.props.children[0];
        let child2 = this.props.children[1];
        
        let style0 = {
            position: 'relative',
            left: 0,
            top: 0,
            width: width,
            height: height
        };
        let style1 = {
            position: 'absolute',
            left: 0,
            top: 0,
            width: width1,
            height: height
        };
        let style2 = {
            position: 'absolute',
            left: width1 + gripWidth,
            top: 0,
            width: width2,
            height: height
        };
        let styleGrip = {
            position: 'absolute',
            top: 0,
            width: gripWidth,
            height: height,
            background: 'rgb(230, 230, 230)',
            cursor: 'col-resize',
            zIndex: 100
        };
        let styleGripInner = {
            position: 'absolute',
            top: 0,
            left: 0,
            width: 4,
            height: height,
            background: 'gray',
            cursor: 'col-resize'
        };
        return (
            <div style={style0}>
                <div style={style1} className="ADContainerChild">
                    <child1.type {...child1.props} width={width1} height={height} />
                </div>
                <Draggable
                    position={{x: gripPosition, y: 0}}
                    axis="x"
                    onDrag={this._handleGripDrag}
                    onStop={this._handleGripDragStop}
                >
                    <div style={styleGrip}>
                        <div style={styleGripInner} />
                    </div>
                </Draggable>
                
                <div style={style2} className="ADContainerChild">
                    <child2.type {...child2.props} width={width2} height={height} />
                </div>
            </div>
        )
    }
}




class ContentView extends Component {
    state = {}
    render() {
        const { data } = this.props;
        let props = {
            width: this.props.width
        };
        if (!data) {
            return (
                <div></div>
            );
        }
        if (data.type === 'epoch') {
            return (
                <EpochView
                    data={data}
                    onNtrodeClicked={this.props.onNtrodeClicked}
                    {...props}
                />
            );
        }
        else if (data.type === 'ntrode') {
            return (
                <NtrodeView
                    data={data}
                    reactopyaParent={this.props.reactopyaParent}
                    onViewSortingResults={this.props.onViewSortingResults}
                    onViewSortingResultsCurated={this.props.onViewSortingResultsCurated}
                    {...props}
                />
            );
        }
        else if (data.type === 'sorting_results') {
            return (
                <SortingResultsView
                    data={data}
                    reactopyaParent={this.props.reactopyaParent}
                    {...props}
                />
            )
        }
        else {
            return (
                <div>
                    Unrecognized type in data:
                    <pre>{JSON.stringify(data, null, 4)}</pre>
                </div>
            );
        }
    }
}

class RespectStatus extends Component {
    state = {}
    render() {
        switch (this.props.status) {
            case 'running':
                return <div>Running: {this.props.status_message}</div>
            case 'error':
                return <div>Error: {this.props.status_message}</div>
            case 'finished':
                return this.props.children;
            default:
                return <div>Unknown status: {this.props.status}</div>
        }
    }
}