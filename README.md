# Tally

[![Build Status](https://travis-ci.org/jzacharuk/tallytest.svg?branch=master)](https://travis-ci.org/jzacharuk/tallytest)
[![Code Climate](https://codeclimate.com/github/jzacharuk/tallytest/badges/gpa.svg)](https://codeclimate.com/github/jzacharuk/tallytest)
[![Test Coverage](https://codeclimate.com/github/jzacharuk/tallytest/badges/coverage.svg)](https://codeclimate.com/github/jzacharuk/tallytest/coverage)
[![Issue Count](https://codeclimate.com/github/jzacharuk/tallytest/badges/issue_count.svg)](https://codeclimate.com/github/jzacharuk/tallytest)

Tally is a component of endpoint solution for the Health Data Coalition.
TBD

### Production

For production usage, it is recommended to use the Docker build.
TBD

### Development

#### Installation

Tally requires the following pre-requisites:
- [Node.js](https://nodejs.org/) v6+ to run.

The project can be installed and run by executing the following commands:
```sh
$ npm install
$ npm start
```

#### Code Style
The project follows the Airbnb styleguide and uses eslint to enforce the rules. The Airbnb guide is supplemented to ensure that code is documented as well (see below). The following command will check the style of code and display warning and errors to the console.

```sh
$ npm run lint
```
Although the above command can be run manually, it is recommended to configure your code editor to show you style errors in real time. 

#### Documentation
This project utilized jsdoc style comments throughout the code. The following command will create a docs folder and generate html documentation based on those comments:
```sh
$ npm run doc
```
To browse the documentation open the docs/index.html page.

#### Testing
This project has automated test files that are written using Chai, run using Mocha and coverage reports created using Istanbul. The following command will run the tests, outputting the results to the console, and generate the coverage report.
```sh
$ npm test
```
To browse the coverage report open the coverage/index.html page.

### Tech

Tally uses a number of open source projects to work properly:

Production
* [async] - asynchronous javascript helper utilities
* [pg] - postgres client
* [winston] - logging

Development
* [airbnb] - Airbnb's styleguide
* [chai] - assertion library for testing.
* [eslint] - awesome web-based text editor
* [istanbul] - code coverage reports
* [mocha] - test framework

Tools
- Atom
- Git and Github
- Docker

## License

GNU General Public License v3.0

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

   [istanbul]: <https://www.npmjs.com/package/istanbul>
   [mocha]: <https://www.npmjs.com/package/mocha>
   [async]: <https://www.npmjs.com/package/async>
   [pg]: <https://www.npmjs.com/package/pg>
   [winston]: <https://www.npmjs.com/package/winston>
   [chai]: <https://www.npmjs.com/package/chai>
   [eslint]: <https://www.npmjs.com/package/eslint>
   [airbnb]: <https://www.npmjs.com/package/eslint-config-airbnb>
