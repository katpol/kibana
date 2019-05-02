/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { Component, Fragment } from 'react';
import { ALL_SOURCES, DATA_SOURCES } from '../../shared/layers/sources/all_sources';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiPanel,
  EuiSpacer,
  EuiCard,
  EuiIcon,
  EuiFlyoutHeader,
  EuiFlyoutFooter,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
import { GeojsonFileSource } from '../../shared/layers/sources/client_file_source';
import _ from 'lodash';

export class AddLayerPanel extends Component {

  state = {
    sourceType: null,
    isLoading: false,
    hasLayerSelected: false,
    layer: null,
    indexingTriggered: false,
    importIndexingReady: false
  }

  _viewLayer = source => {
    if (!source) {
      this.setState({ layer: null });
      this.props.removeTransientLayer();
      return;
    }


    const layerOptions = this.state.layer
      ? { style: this.state.layer.getCurrentStyle().getDescriptor() }
      : {};
    this.setState({
      layer: source.createDefaultLayer(layerOptions, this.props.mapColors)
    }, () => this.props.viewLayer(this.state.layer)
    );
  };

  _addImportedLayer = async source => {
    await this.props.removeTransientLayer();
    this.setState({
      layer: source.createDefaultLayer({}, this.props.mapColors)
    }, () => this.props.addImportedLayer(this.state.layer)
    );
  };

  _clearSource = () => {
    this.setState({
      layer: null,
      sourceType: null
    });
    this.props.removeTransientLayer();
  }

  _onSourceTypeChange = (sourceType) => {
    this.setState({ sourceType });
  }

  _renderNextBtn() {
    if (!this.props.importView && !this.state.sourceType) {
      return null;
    }

    const { hasLayerSelected, isLoading, selectLayerAndAdd, importView } = this.props;
    return (
      <EuiButton
        disabled={!hasLayerSelected || importView && !this.state.importIndexingReady}
        isLoading={hasLayerSelected && isLoading}
        iconSide="right"
        iconType={'sortRight'}
        onClick={() => {
          const layerSource = this.state.layer.getSource();
          const boolIndexLayer = layerSource.shouldBeIndexed();
          this.setState({ layer: null });
          if (boolIndexLayer) {
            this.setState({
              indexingTriggered: true
            });
          } else {
            selectLayerAndAdd();
          }
        }}
        fill
      >
        <FormattedMessage
          id="xpack.maps.addLayerPanel.addLayerButtonLabel"
          defaultMessage="Add layer"
        />
      </EuiButton>
    );
  }

  _renderSourceCards() {
    return DATA_SOURCES.map(Source => {
      const icon = Source.icon
        ? <EuiIcon type={Source.icon} size="l" />
        : null;
      return (
        <Fragment key={Source.type}>
          <EuiSpacer size="s" />
          <EuiCard
            className="mapLayerAddpanel__card"
            title={Source.title}
            icon={icon}
            onClick={() => this._onSourceTypeChange(Source.type)}
            description={Source.description}
            layout="horizontal"
            data-test-subj={_.camelCase(Source.title)}
          />
        </Fragment>
      );
    });
  }

  _renderSourceSelect() {
    return (
      <Fragment>
        <EuiTitle size="xs">
          <h2>
            <FormattedMessage
              id="xpack.maps.addLayerPanel.chooseDataSourceTitle"
              defaultMessage="Choose data source"
            />
          </h2>
        </EuiTitle>
        {this._renderSourceCards()}
      </Fragment>
    );
  }

  _getEditorProperties = (importView = false) => {
    let editorProperties = {
      onPreviewSource: this._viewLayer,
      inspectorAdapters: this.props.inspectorAdapters,
    };
    if (importView) {
      editorProperties = {
        ...editorProperties,
        boolIndexData: this.state.indexingTriggered,
        addAndViewSource: source => this._addImportedLayer(source),
        onRemove: this.props.removeTransientLayer,
        onIndexReadyStatusChange: indexReady => this.setState(
          { importIndexingReady: indexReady }
        ),
      };
    }
    return editorProperties;
  }

  _renderSourceEditor() {
    const Source = ALL_SOURCES.find(Source => {
      return Source.type === this.state.sourceType;
    });
    if (!Source) {
      throw new Error(`Unexpected source type: ${this.state.sourceType}`);
    }

    return (
      <Fragment>
        <EuiButtonEmpty
          size="xs"
          flush="left"
          onClick={this._clearSource}
          iconType="arrowLeft"
        >
          <FormattedMessage
            id="xpack.maps.addLayerPanel.changeDataSourceButtonLabel"
            defaultMessage="Change data source"
          />
        </EuiButtonEmpty>
        <EuiSpacer size="s" />
        <EuiPanel>
          {Source.renderEditor(this._getEditorProperties())}
        </EuiPanel>
      </Fragment>
    );
  }

  _renderFileImportEditor() {
    return (
      <EuiPanel>
        {
          GeojsonFileSource.renderEditor(
            this._getEditorProperties(true)
          )
        }
      </EuiPanel>
    );
  }

  _renderAddLayerForm() {
    if (!this.state.sourceType) {
      return this._renderSourceSelect();
    }

    return this._renderSourceEditor();
  }

  _renderFlyout(importView) {
    return (
      <EuiFlexGroup
        direction="column"
        gutterSize="none"
      >
        <EuiFlyoutHeader hasBorder className="mapLayerPanel__header">
          <EuiTitle size="s">
            <h2>
              <FormattedMessage
                id="xpack.maps.addLayerPanel.panelTitle"
                defaultMessage="Add layer"
              />
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>

        <div className="mapLayerPanel__body" data-test-subj="layerAddForm">
          <div className="mapLayerPanel__bodyOverflow">
            {
              importView
                ? this._renderFileImportEditor()
                : this._renderAddLayerForm()
            }
          </div>
        </div>

        <EuiFlyoutFooter className="mapLayerPanel__footer">
          <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                onClick={this.props.closeFlyout}
                flush="left"
                data-test-subj="layerAddCancelButton"
              >
                <FormattedMessage
                  id="xpack.maps.addLayerPanel.cancelButtonLabel"
                  defaultMessage="Cancel"
                />
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              {this._renderNextBtn()}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      </EuiFlexGroup>
    );
  }

  render() {
    const { importView, flyoutVisible } = this.props;
    return (flyoutVisible) ? this._renderFlyout(importView) : null;
  }
}
