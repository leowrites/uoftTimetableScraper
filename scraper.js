const mongoose = require('mongoose');
const fetch = require('node-fetch');
const { Course } = require('./course');
require('dotenv').config();

// set a timer to run this every 24 hours

// connects to mongoDB
mongoose.connect(process.env.MONGO_URL).then(() => {
  scrape();
  // call scraper
});

const convertDay = {
  MO: 'Monday',
  TU: 'Tuesday',
  WE: 'Wednesday',
  TH: 'Thursday',
  FR: 'Friday',
};

// const deleteAll = () => {
//   Course.deleteMany({}, (err) => {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log('Success');
//       Promise.resolve('success');
//     }
//   });
// };

const makeSection = (section) => {
  //   if (section.meetingStartTime !== null) {
  return {
    day: convertDay[section.meetingDay],
    startTime: section.meetingStartTime,
    endTime: section.meetingEndTime,
    assignedRoom1: section.assignedRoom1,
  };
  //   }
};

const makeNewCourse = (data, key) => {
  return new Course({
    courseCode: data[key].code,
    courseTitle: data[key].courseTitle,
    university: 'uoft',
    term: data[key].section,
    sections: Object.keys(data[key].meetings).map((section) => {
      if (section.slice(0, 3) === 'LEC')
        return {
          sectionCode: section,
          term: data[key].section,
          instructors: data[key].meetings[section].instructors,
          meetingTimes: Object.keys(data[key].meetings[section].schedule).map((meeting) => {
            return makeSection(data[key].meetings[section].schedule[meeting]);
          }),
        };
    }),
    tutorials: Object.keys(data[key].meetings).map((section) => {
      if (section.slice(0, 3) === 'TUT')
        return {
          tutorialCode: section,
          term: data[key].section,
          instructors: data[key].meetings[section].instructors,
          meetingTimes: Object.keys(data[key].meetings[section].schedule).map((meeting) => {
            return makeSection(data[key].meetings[section].schedule[meeting]);
          }),
        };
    }),
  });
};

const cleanData = (data) => {
  for (const key in data) {
    let course = makeNewCourse(data, key);
    course.sections = course.sections?.filter(
      (section) => (section !== undefined && !section?.meetingTimes.some((meetingTime) => meetingTime.startTime === null))
    );
    course.tutorials = course.tutorials?.filter(
      (tutorial) => (tutorial !== undefined && !tutorial?.meetingTimes.some((meetingTime) => meetingTime.startTime === null))
    );
    console.log(course.sections);
    //   await course.save();
  }
  //   deleteAll().then(async () => {
  //   });
};

const scrape = () => {
  fetch(
    'https://timetable.iit.artsci.utoronto.ca/api/20229/courses?' +
      new URLSearchParams({
        section: 'F,Y,S',
      })
  )
    .then((res) => res.json())
    .then((data) => cleanData(data));
};

// setInterval(scrape, 1000)
