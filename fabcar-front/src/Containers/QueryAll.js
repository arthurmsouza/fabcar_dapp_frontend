import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import axios from 'axios';



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
  
  constructor(props) {
    super(props)
    this.state = {
      resultado: ''
    }
    this.socket = this.props.socket
    this.handleClick = this.handleClick.bind(this)
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  handleClick () { 
    axios.get('http://localhost:8080/api/queryallcars')
      .then(response => this.setState({resultado: response.data.response}))
  
    }
  
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
        <Button variant="contained" color="primary" className={classes.button} onClick={this.handleClick}>queryallcars</Button>
        <p>{this.state.resultado}</p>
      </div>  
      </div>
      
    );
  }
}


export default withStyles(styles)(QueryAll);