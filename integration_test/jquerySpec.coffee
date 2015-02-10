jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000

fhir = require('../src/adapters/jquery.coffee')

describe "jquery", ->
  subject = fhir
      baseUrl: 'https://ci-api.fhir.me',
      patient: '123',
      auth: {user: 'client', pass: 'secret'}

  mkfail = (done)->
    (err)->
      console.log(err)
      done()

  it "simplest", (done) ->
    subject.search(type: 'Patient', query: {name: 'maud'})
      .done (d)-> done()
      .fail mkfail(done)

  it "can convert results to an in-memory graph", (done) ->
    subject.search(type: 'Observation', graph: true, query: {$include: {Observation: 'subject'}})
      .done (d)->
        expect(d[0].subject.resourceType).toBe('Patient')
        done()
      .fail mkfail(done)


  it "can post", (done) ->
    exampleSecEvent = {
      "resourceType": "SecurityEvent",
      "event": {
        "type": {
          "coding": [{
            "system": "http://nema.org/dicom/dcid",
            "code": "110114",
            "display": "User Authentication"
          }]
        },
        "subtype": [{
          "coding": [{
            "system": "http://nema.org/dicom/dcid",
            "code": "110122",
            "display": "Login"
          }]
        }],
        "action": "E",
        "dateTime": "2014-09-13T13:48:42Z",
        "outcome": "0"
      },
      "participant": [{
        "userId": "service",
        "network": {
          "identifier": "service",
          "type": "2"
        }
      }],
      "source": {
        "site": "Cloud",
        "identifier": "Health Intersections",
        "type": [{
          "system": "http://hl7.org/fhir/security-source-type",
          "code": "3",
          "display": "Web Server"
        }]
      }
    }

    subject.create {entry: {content: exampleSecEvent}}
      .then (response)->
        done()
      .fail mkfail(done)

  it "can resolve refs", (done) ->
    subject.search
      type: 'MedicationPrescription'
      query:
        $include:
          MedicationPrescription: 'medication'
    .then (rxs)->
      rx = rxs.entry[0].content
      med = subject.resolveSync
        reference: rx.medication
        resource: rx
        bundle: rx
      expect(med.content).toBeTruthy()
      done()
