// https://loyaltyapi.yotpo.com/reference/createupdate-customer-records

const { credsFromPayload, ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['email', Boolean],
]);

const yotpoCustomerUpsert = async (
  credsPayload,
  email,
  {
    apiVersion,
   
    id,
    firstName,
    lastName,
    phoneNumber,
    countryIsoCode,
    hasAccount,
    platformAccountCreatedAt,
    optedIn,
    posAccountId,
    tags,
    optedInAt,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    email,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const creds = await credsFromPayload(credsPayload);

  const body = {
    email,
    ...(id && { id }),
    ...(firstName && { first_name: firstName }),
    ...(lastName && { last_name: lastName }),
    ...(phoneNumber && { phone_number: phoneNumber }),
    ...(countryIsoCode && { country_iso_code: countryIsoCode }),
    ...(hasAccount !== undefined && { has_account: hasAccount }),
    ...(platformAccountCreatedAt && { platform_account_created_at: platformAccountCreatedAt }),
    ...(optedIn !== undefined && { opted_in: optedIn }),
    ...(posAccountId && { pos_account_id: posAccountId }),
    ...(tags && { tags }),
    ...(optedInAt && { opted_in_at: optedInAt }),
  };

  const response = await yotpoClient.fetch({
    url: '/customers',
    method: 'post',
    body,
    context: {
      creds,
      apiVersion,
    },
  });

  return response;
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  yotpoCustomerUpsert,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/yotpoCustomerUpsert" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "yotpo.johto" },
    "email": "ash@pokemail.com",
    "options": {
      "id": "1",
      "firstName": "Ash",
      "lastName": "Ketchum"
    }
  }'
*/
