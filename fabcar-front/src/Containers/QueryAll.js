import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';


const styles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 200,
  },
  menu: {
    width: 200,
  },
});





class QueryAll extends React.Component {
  state = {
    result: null
  };

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  toggleButtonState() {
    fetch('http://ec2-18-236-204-160.us-west-2.compute.amazonaws.com:8080/api/queryallcars', {
      mode: 'no-cors' // 'cors' by default
    })
    .then(results => this.setState({ result: results.json()})) 
  };
  
  render() {
    const { classes } = this.props;

    return (
      <div className="Main-inside" >
      <Typography  variant="display2">
      Query all cars
      </Typography>
      <br/>
      <br/>
        <Button variant="contained" color="primary" className={classes.button} disabled={!this.props.connected} onClick={ () => {
            this.props.switchFeedHandler(1)
            this.props.socket.emit('REQUEST', {action: "QUERYALL"})
            }}>
            {this.props.connected ? "SEARCH All" : "DISCONNECTED"}
        </Button>
      <br/>
      <div>
        <Button variant="contained" color="primary" className={classes.button} onClick={this.toggleButtonState}>queryallcars</Button>
        <div>{this.state.result}</div>
      </div>  
      </div>
      
    );
  }
}


export default withStyles(styles)(QueryAll);