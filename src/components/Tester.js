// Type Master
// Last Edit: June 6th, 2018
// Authors: Ben Martinson

import React, { Component } from "react";
import { MyContext } from "../context/dataStore";
import Timer from "./Timer";
import {textSamples} from "../helpers/other";

import "../style.css";

class Tester extends Component {
  constructor(props) {
    super(props);

    this.errorList = {};
    this.speedOverTime = [];
    this.accOverTime = [];
    this.wordErrorList = {};
    this.errorLocations = [];
    this.wordIndex = 0;

    this.spaceErrors = []
    this.sampleArray = []
    this.retrieveRandomText = this.retrieveRandomText.bind(this);

    this.retrieveRandomText();

    this.prevKeyWasSpace = true;
    this.prevKeyWasSpace2 = false;
    this.prevKeyDelete = false;

    var wordC = [];
    wordC[0] = 0;
    for (var i = 1; i < this.sampleArray.length; ++i) {
      wordC[i] = wordC[i - 1] + this.sampleArray[i - 1].length;
    }
    this.wordCount = wordC;

    this.wordIC = Array.apply(null, Array(this.sampleArray.length)).map(
      Number.prototype.valueOf,
      0
    );


    this.state = {
      input: "",
      testStart: false,
      currentSpeed: 60,
      errorCount: 0,
      testOver: false,
      timeChoice: this.props.timeChoice,
      testNumber: this.props.testNumber,
      training: this.props.training

    };

    this.handleChange = this.handleChange.bind(this);
    this.handleKeyChange = this.handleKeyChange.bind(this);
    this.handleErrorKey = this.handleErrorKey.bind(this);
    this.handleSpaceKey = this.handleSpaceKey.bind(this);
    this.updateTime = this.updateTime.bind(this);
    this.testIsOver = this.testIsOver.bind(this);
  }

  componentDidMount() {
    let testNum = this.props.testNumber + 1;
    if(!testNum) testNum = 1

    this.setState({
      currentSpeed: 60,
      testNumber: testNum,
    });
  }

  retrieveRandomText(){
    const { diffu, training } = this.props;
    var choosenText = Math.floor(Math.random() * textSamples[diffu].length)
    const sample = textSamples[diffu][choosenText];

    if(training === true){
      this.props.updateTexts(diffu, choosenText)
    }
    this.sampleArray = sample.split(" ");
    this.spaceErrors = Array.apply(null, Array(this.sampleArray.length)).map(
      Number.prototype.valueOf,
      0
    );
  }


  handleChange(event) {
    const {sampleArray, wordIndex, wordIC, prevKeyWasSpace2 } = this;
    if(wordIndex+1 === sampleArray.length &&
      wordIC[wordIndex] >= sampleArray[sampleArray.length-1].length) {
        this.testIsOver()
      }
    let keyValue = event.target.value.charAt(event.target.value.length - 1)
    if (keyValue !== " " || !prevKeyWasSpace2){
      if(keyValue === " ") this.prevKeyWasSpace2 = true
      else this.prevKeyWasSpace2 = false

      this.setState({ input: event.target.value, testStart: true });
    }
  }

  handleKeyChange(event) {
    const {wordIndex, wordIC, prevKeyWasSpace, prevKeyDelete } = this;
    if ((event.key !== " " || !prevKeyWasSpace) &&
        (event.key !== " " || wordIC[wordIndex] !== 0 || !prevKeyDelete)) {
      if (event.key === "Backspace") this.handleBackSpace();
      else if (event.key === " ") {
        this.handleSpaceKey();
      } else if (event.key === "Shift") {
        //Do nothing (to avoid incrementing index)
      } else {
        this.handleInputKey(event);
      }
    }

    if(event.key === "Backspace") this.prevKeyDelete = true;
    else this.prevKeyDelete = false;
    if(event.key === " ") this.prevKeyWasSpace = true;
    else this.prevKeyWasSpace = false;
  }

  handleSpaceKey() {
    const {sampleArray, wordIndex, wordIC, prevKeyWasSpace } = this;
    let lenCurrentWord = sampleArray[wordIndex].length;
    if (wordIC[wordIndex] < lenCurrentWord) {
      let numOfErrors = lenCurrentWord - wordIC[wordIndex];
      this.setState({
        errorCount: this.state.errorCount + numOfErrors
      });
      this.spaceErrors[wordIndex] = numOfErrors;
      this.addToWordErrorList(sampleArray[wordIndex]);
    }
    if (wordIndex + 1 < sampleArray.length && !prevKeyWasSpace) {
      this.wordIndex += 1;
    }
    this.prevKeyWasSpace = true;
  }

  handleInputKey(event) {
    const {sampleArray, wordIndex, wordIC } = this;
    let correctKey = "";
    if (wordIC[wordIndex] < sampleArray[wordIndex].length) {
      correctKey = sampleArray[wordIndex].charAt(
        wordIC[wordIndex]
      );
    }

    if (correctKey !== event.key) {
      //User key error - must record and add to errorCount
      this.handleErrorKey(correctKey.toLowerCase());
    }

    this.wordIC[wordIndex] += 1;
    this.prevKeyWasSpace = false;
    this.setState({
      testStart: true
    });
  }

  addToWordErrorList(wordMissed) {
    if (!this.prevKeyWasSpace) {
      if (!(wordMissed in this.wordErrorList)) {
        this.wordErrorList[wordMissed] = 0;
      }
      this.wordErrorList[wordMissed] += 1;
    }
  }

  handleErrorKey(correctKey) {
    const {sampleArray, wordIndex, wordIC, wordCount, errorList } = this;
    this.addToWordErrorList(sampleArray[wordIndex]);

    if (
      correctKey in errorList &&
      wordIC[wordIndex] < wordCount[wordIndex]
    ) {
      this.errorList[correctKey] += 1;
    } else {
      this.errorList[correctKey] = 1;
    }

    if (wordIC[wordIndex] < sampleArray[wordIndex].length) {
      this.errorLocations.push(
        wordCount[wordIndex] + wordIC[wordIndex]
      );
    }
    this.setState({
      errorCount: this.state.errorCount + 1
    });
  }

  handleBackSpace() {
    const {sampleArray, wordIndex, wordIC, wordCount, errorLocations, spaceErrors } = this;
    this.prevKeyWasSpace = false;
    if (wordIC[wordIndex] > sampleArray[wordIndex].length) {
      this.setState({
        errorCount: this.state.errorCount - 1
      });
    }
    if (wordIC[wordIndex] !== 0) {
      //Still on current word, no need to change to prev word
      this.wordIC[wordIndex] -= 1;
    } else if (wordIndex === 0) {
      //at first word, do nothing
    } else {
      //Change to prev word
      this.setState({
        errorCount: this.state.errorCount - spaceErrors[wordIndex - 1]
      });
      this.spaceErrors[wordIndex - 1] = 0;
      this.wordIndex -= 1;
    }
    if (
      errorLocations[errorLocations.length - 1] -
        wordCount[wordIndex] === wordIC[wordIndex]
    ) {
      this.errorLocations.splice(-1, 1);
      this.setState({
        errorCount: this.state.errorCount - 1
      });
    }
  }

  updateTime(secs) {
    const { sampleArray, wordIndex, wordCount, wordIC, spaceErrors } = this;
    const { input } = this.state;
    let elapsedTime = this.props.timeChoice - secs;
    let fractionOfCurWord = 0.5;

    if (wordIndex + 1 !== sampleArray.length)
      fractionOfCurWord =
        wordIC[wordIndex] /
        (wordCount[wordIndex + 1] - wordCount[wordIndex]);

    if (secs % 5 === 0 && elapsedTime != 0) {
      //time to update speed and accuracy data
      let idx = elapsedTime / 5 - 1;
      this.speedOverTime[idx] = this.state.currentSpeed; //index will = 0, 1, 2 ...

      let spaceErrorSum = 0
      for(var i = 0; i < spaceErrors.length; ++i){
        spaceErrorSum += spaceErrors[i]
      }
      let lenOfInput = input.length + spaceErrorSum;
      if (lenOfInput == 0) {
        lenOfInput = 1;
      } //To avoid divide by 0
      this.accOverTime[idx] = Math.floor(
        (lenOfInput - this.state.errorCount) / lenOfInput * 100
      );
    }

    let wpm = 60
    if(input.length != 0)
      wpm = Math.floor(input.length / 5 / elapsedTime * 60);
    this.setState({
      currentSpeed: wpm
    });
  }

  highlighted() {
    const { sampleArray, wordIndex } = this;
    let remainingWords = sampleArray.length - 1 - wordIndex;
    let past = sampleArray.slice(0, wordIndex).join(" ");
    let current = " " + sampleArray[wordIndex];
    let future = "";
    if (wordIndex < sampleArray.length - 1) {
      future = " " + sampleArray.slice(-1 * remainingWords).join(" ");
    }

    return (
      <div>
        <span style={{ opacity: 0.5 }}>{past}</span>
        <span style={{ color: "blue" }}>{current}</span>
        <span>{future}</span>
      </div>
    );
  }

  testIsOver() {
    // console.log('testIsOver')
    this.props.testHandler(this.state.currentSpeed, this.speedOverTime, this.accOverTime, this.errorList, this.wordErrorList)
    if(this.state.training && this.props.testNumber == 9){
      this.props.trainingIsOver()
    }
    this.setState({testOver: true})
  }

  render() {
    if (this.state.testOver === true) {
      return (
        <div>
          <MyContext.Consumer>
            {context => <div>{context.state.setData(this.errorList)}</div>}
          </MyContext.Consumer>
        </div>
      );
    }
    return (
      <div className="col-md-10 offset-md-1">
        <div className="row">
          <div className="col-md-9 card bg-light mb-3">
                <div className="card-header">
                  {this.state.training && <span> Training Test Level {this.props.testNumber+1}</span>}
                  {!this.state.training && <span> Practice Test</span>}
                  <div align="right" className="inline-div text-capitalize">Text Difficulty: {this.props.diffu} </div>
                  {this.props.changeTimeHandler?
                    <button type="button" className="btn btn-primary ml-2" onClick={this.props.changeTimeHandler} >Change Time</button>
                    : []}
                </div>
                <div className="card-body">
                  <div className="card-body">
            <div className="sampleInnerBox"><span>{this.highlighted()}</span></div>
            <div className="display-center sampleTextInput">
            <input
              align="middle"
              className="input"
              placeholder="Click here to start typing..."
              value={this.state.input}
              onChange={this.handleChange}
              onKeyDown={this.handleKeyChange}
            />
          </div>
                  </div>
          </div>
          </div>
          <div className="col-md-2">
            <div className="display-center">
              <div className="card text-white bg-primary mb-3">
                <div className="card-header">Time Left</div>
                <div className="card-body">
                  <h5 className="card-title">
                    {this.props.timeChoice != 0 && <Timer className="small-display"
                      signal={this.state.testStart}
                      timeChoice={this.props.timeChoice}
                      callBack={this.updateTime}
                      callBack2={this.testIsOver}
                    />}
                  </h5>
                </div>
              </div>
              <div className="card text-white bg-secondary mb-3">
                <div className="card-header">Speed</div>
                <div className="card-body">
                  <h5 className="card-title">
                    {this.state.currentSpeed}
                  </h5>
                </div>
              </div>
              <div className="card text-white bg-secondary mb-3">
                <div className="card-header">Mistyped keystrokes</div>
                <div className="card-body">
                  <h5 className="card-title">
                    {this.state.errorCount}
                  </h5>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Tester;
