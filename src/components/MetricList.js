import React, { useEffect, useState, } from 'react';
import { useQuery, useSubscription, } from 'urql';
import { useDispatch, useSelector, } from 'react-redux';
import * as actions from '../store/actions';
import Charts from './Charts';
import DisplayBox from './DisplayBox';
import { Dropdown, Loader, Dimmer, } from 'semantic-ui-react';
import Container from '@material-ui/core/Container';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';



const current_time = new Date().valueOf();

let styles = {
  div1: {
    textAlign: 'right',
    margin: '20px',
  },
  div2: {
    margin: '10px',
  },
  div3: {
    margin: '25px',
  },

}

const query_metric = `
    query {
        getMetrics
    }`;

const query_multiple_measurements = `

query($input: [MeasurementQuery] = [
  {metricName: "tubingPressure", after: ${current_time -
    1800000}, before: ${current_time}},
  {metricName: "casingPressure", after: ${current_time -
    1800000}, before: ${current_time}},
  {metricName: "oilTemp", after: ${current_time -
    1800000}, before: ${current_time}},
  {metricName: "flareTemp", after: ${current_time -
    1800000}, before: ${current_time}},
  {metricName: "waterTemp", after: ${current_time -
    1800000}, before: ${current_time}},
  {metricName: "injValveOpen", after: ${current_time -
    1800000}, before: ${current_time}}
]
){
  getMultipleMeasurements(input: $input) {
    metric
    measurements {
     at
     value
     metric
     unit
    }
  }
}`;

const metric_Subscription_Query = `
  subscription {
    newMeasurement{
      metric
      at
      value
      unit
    }
  }
`;

const getMetric = state => {
  const getMetrics = state.metric.getMetrics;
  return getMetrics;
};



const FetchMetricList = () => {
  let query = query_metric;
  const dispatch = useDispatch();
  let [result] = useQuery({
    query,
    variables: {}
  });

  const { fetching, data, error } = result;

  useEffect(() => {
    if (error) {
      dispatch({ type: actions.METRIC_API_CALL_FAIL, error });
    }
    if (!data) {
      return;
    }
    if (fetching) {
      return;
    }
    const getMetrics = data;
    dispatch({ type: actions.METRICS_DATA_RECEIVED, getMetrics });
  }, [dispatch, data, error, fetching]);
};

const FetchMultipleMeasurements = () => {
  const dispatch = useDispatch();
  let [result] = useQuery({
    query: query_multiple_measurements,
    variable: []
  });
  const { data, error, fetching } = result;
  useEffect(() => {
    if (error) {
      dispatch({ type: actions.MULTIPLE_MEASUREMENTS_API_CALL_FAIL, error });
    }
    if (!data) {
      return;
    }
    if (fetching) {
      return;
    }
    const getMultipleMeasurements = data;
    dispatch({
      type: actions.METRICS_MEASUREMENTS_RECEIVED,
      getMultipleMeasurements
    });
  }, [dispatch, data, error, fetching]);
};

const metricListToDropDownFormat = (options, getMetrics) => {
  getMetrics.getMetrics.forEach(value => {
    let obj = { key: value, text: value, value: value };
    options.push(obj);
  });
  return options;
};

const FetchNewMeasurementData = state => {
  const dispatch = useDispatch();
  const [result] = useSubscription({
    query: metric_Subscription_Query,
    variables: {}
  });
  const { data, error } = result;
  useEffect(() => {
    if (error) {
      dispatch({ type: actions.NEW_MEASUREMENTS_API_CALL_FAIL, error });
    }
    if (!data) {
      return;
    }
    const newMeasurementData = data;
    if (state.switch === true)
      dispatch({
        type: actions.NEW_MEASUREMENTS_RECEIVED,
        newMeasurementData
      });
  }, [data, error, dispatch, state]);
};

const MetricList = () => {
  const [metricState, setMetricState] = useState({
    switch: true,
    value: []
  });

  FetchMetricList(); 
  FetchMultipleMeasurements();
  FetchNewMeasurementData(metricState);
  const getMetrics = useSelector(getMetric);
  let options = [];
  if (getMetrics.length === 0)
    return (
      <Dimmer active>
        <Loader size="massive">Loading..</Loader>
      </Dimmer>
    );
  options = metricListToDropDownFormat(options, getMetrics);

  const handleSelectionChange = (event, { value }) => {
    setMetricState({ ...metricState, value });
  };
  const toggleChange = name => event => {
    setMetricState({ ...metricState, [name]: event.target.checked });
  };

  return (
    <div>
      <div style={styles.div1}>
        <FormControlLabel
          control={
            <Switch
              checked={metricState.switch}
              onChange={toggleChange('switch')}
              value="switch"
              color="primary"
            />
          }
          label="real-time"
        />
      </div>
      <Container maxWidth="sm">
        <Dropdown
          placeholder="Select..."
          fluid
          multiple
          selection
          options={options}
          style={styles.div2}
          onChange={handleSelectionChange}
        />
      </Container>
      <div style={styles.div3}>
        <Charts command={metricState} />
      </div>
      <div>
        <DisplayBox display={metricState} />
      </div>
    </div>
  );
};


export default () => {  return <MetricList />; };
