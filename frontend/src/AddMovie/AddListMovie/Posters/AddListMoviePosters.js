import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { WindowScroller } from 'react-virtualized';
import { FixedSizeGrid as Grid } from 'react-window';
import getIndexOfFirstCharacter from 'Utilities/Array/getIndexOfFirstCharacter';
import hasDifferentItemsOrOrder from 'Utilities/Object/hasDifferentItemsOrOrder';
import dimensions from 'Styles/Variables/dimensions';
import Measure from 'Components/Measure';
import AddListMovieItemConnector from 'AddMovie/AddListMovie/AddListMovieItemConnector';
import AddListMoviePosterConnector from './AddListMoviePosterConnector';
import styles from './AddListMoviePosters.css';

// Poster container dimensions
const columnPadding = parseInt(dimensions.movieIndexColumnPadding);
const columnPaddingSmallScreen = parseInt(dimensions.movieIndexColumnPaddingSmallScreen);
const progressBarHeight = parseInt(dimensions.progressBarSmallHeight);
const detailedProgressBarHeight = parseInt(dimensions.progressBarMediumHeight);

const additionalColumnCount = {
  small: 3,
  medium: 2,
  large: 1
};

function calculateColumnWidth(width, posterSize, isSmallScreen) {
  const maxiumColumnWidth = isSmallScreen ? 172 : 182;
  const columns = Math.floor(width / maxiumColumnWidth);
  const remainder = width % maxiumColumnWidth;

  if (remainder === 0 && posterSize === 'large') {
    return maxiumColumnWidth;
  }

  return Math.floor(width / (columns + additionalColumnCount[posterSize]));
}

function calculateRowHeight(posterHeight, sortKey, isSmallScreen, posterOptions) {
  const {
    detailedProgressBar,
    showTitle
  } = posterOptions;

  const nextAiringHeight = 19;

  const heights = [
    posterHeight,
    detailedProgressBar ? detailedProgressBarHeight : progressBarHeight,
    nextAiringHeight,
    isSmallScreen ? columnPaddingSmallScreen : columnPadding
  ];

  if (showTitle) {
    heights.push(19);
  }

  switch (sortKey) {
    case 'studio':
    default:
      // No need to add a height of 0
  }

  return heights.reduce((acc, height) => acc + height, 0);
}

function calculatePosterHeight(posterWidth) {
  return Math.ceil((250 / 170) * posterWidth);
}

class AddListMoviePosters extends Component {

  //
  // Lifecycle

  constructor(props, context) {
    super(props, context);

    this.state = {
      width: 0,
      columnWidth: 182,
      columnCount: 1,
      posterWidth: 162,
      posterHeight: 238,
      rowHeight: calculateRowHeight(238, null, props.isSmallScreen, {})
    };

    this._isInitialized = false;
    this._grid = null;
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      items,
      sortKey,
      posterOptions,
      jumpToCharacter
    } = this.props;

    const {
      width,
      columnWidth,
      columnCount,
      rowHeight
    } = this.state;

    if (prevProps.sortKey !== sortKey ||
        prevProps.posterOptions !== posterOptions) {
      this.calculateGrid();
    }

    if (this._grid &&
        (prevState.width !== width ||
            prevState.columnWidth !== columnWidth ||
            prevState.columnCount !== columnCount ||
            prevState.rowHeight !== rowHeight ||
            hasDifferentItemsOrOrder(prevProps.items, items, 'tmdbId'))) {
      // recomputeGridSize also forces Grid to discard its cache of rendered cells
      // this._grid.recomputeGridSize();
    }

    if (jumpToCharacter != null && jumpToCharacter !== prevProps.jumpToCharacter) {
      const index = getIndexOfFirstCharacter(items, jumpToCharacter);

      if (this._grid && index != null) {
        const row = Math.floor(index / columnCount);

        this._grid.scrollToItem({
          rowIndex: row,
          columnIndex: 0
        });
      }
    }
  }

  onScroll = ({ scrollTop }) => {
    this._grid.scrollTo({ scrollTop });
  }

  //
  // Control

  setGridRef = (ref) => {
    this._grid = ref;
  }

  calculateGrid = (width = this.state.width, isSmallScreen) => {
    const {
      sortKey,
      posterOptions
    } = this.props;

    const padding = isSmallScreen ? columnPaddingSmallScreen : columnPadding;
    const columnWidth = calculateColumnWidth(width, posterOptions.size, isSmallScreen);
    const columnCount = Math.max(Math.floor(width / columnWidth), 1);
    const posterWidth = columnWidth - padding;
    const posterHeight = calculatePosterHeight(posterWidth);
    const rowHeight = calculateRowHeight(posterHeight, sortKey, isSmallScreen, posterOptions);

    this.setState({
      width,
      columnWidth,
      columnCount,
      posterWidth,
      posterHeight,
      rowHeight
    });
  }

  cellRenderer = ({ rowIndex, columnIndex, style }) => {
    const {
      items,
      sortKey,
      posterOptions,
      showRelativeDates,
      shortDateFormat,
      timeFormat,
      selectedState,
      onSelectedChange
    } = this.props;

    const {
      posterWidth,
      posterHeight,
      columnCount
    } = this.state;

    const {
      showTitle
    } = posterOptions;

    const movieIdx = rowIndex * columnCount + columnIndex;
    const movie = items[movieIdx];

    if (!movie) {
      return null;
    }

    return (
      <div
        className={styles.container}
        style={style}
      >
        <AddListMovieItemConnector
          component={AddListMoviePosterConnector}
          sortKey={sortKey}
          posterWidth={posterWidth}
          posterHeight={posterHeight}
          showTitle={showTitle}
          showRelativeDates={showRelativeDates}
          shortDateFormat={shortDateFormat}
          timeFormat={timeFormat}
          movieId={movie.tmdbId}
          isSelected={selectedState[movie.tmdbId]}
          onSelectedChange={onSelectedChange}
        />
      </div>
    );
  }

  //
  // Listeners

  onMeasure = ({ width }) => {
    this.calculateGrid(width, this.props.isSmallScreen);
  }

  //
  // Render

  render() {
    const {
      isSmallScreen,
      scroller,
      items,
      selectedState
    } = this.props;

    const {
      width,
      columnWidth,
      columnCount,
      rowHeight
    } = this.state;

    const rowCount = Math.ceil(items.length / columnCount);

    return (
      <Measure
        whitelist={['width']}
        onMeasure={this.onMeasure}
      >
        <WindowScroller
          scrollElement={isSmallScreen ? undefined : scroller}
          onScroll={this.onScroll}
        >
          {({ height, registerChild, onChildScroll }) => {
            if (!height) {
              return <div />;
            }

            return (
              <div ref={registerChild}>
                <Grid
                  ref={this.setGridRef}
                  className={styles.grid}
                  height={height}
                  columnCount={columnCount}
                  columnWidth={columnWidth}
                  rowCount={rowCount}
                  rowHeight={rowHeight}
                  width={width}
                  onScroll={onChildScroll}
                  overscanRowCount={2}
                  selectedState={selectedState}
                  style={{ height: '100% !important' }}
                >
                  {this.cellRenderer}
                </Grid>
              </div>
            );
          }
          }
        </WindowScroller>
      </Measure>
    );
  }
}

AddListMoviePosters.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  sortKey: PropTypes.string,
  posterOptions: PropTypes.object.isRequired,
  jumpToCharacter: PropTypes.string,
  scroller: PropTypes.instanceOf(Element).isRequired,
  showRelativeDates: PropTypes.bool.isRequired,
  shortDateFormat: PropTypes.string.isRequired,
  isSmallScreen: PropTypes.bool.isRequired,
  timeFormat: PropTypes.string.isRequired,
  selectedState: PropTypes.object.isRequired,
  onSelectedChange: PropTypes.func.isRequired
};

export default AddListMoviePosters;
