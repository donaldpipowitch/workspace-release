function publish() {
  console.log(process.env.TRAVIS_TAG);
}

exports.publish = publish;
