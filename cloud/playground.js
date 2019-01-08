const { DateTime } = require('luxon')

exports.playground = async ({ event, context }) => {
  const bogus = DateTime.local().setZone('America/Bogus')

  bogus.isValid //=> false
  bogus.invalidReason //=> 'unsupported zone'

  return {
    event,
    context,
    bogus,
  }
}
