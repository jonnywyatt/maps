define(['map/moduleMap'], function () {

    describe('My suite', function () {

        beforeEach(function () {
			this.server = sinon.fakeServer.create();
			this.server.requests[0].respond(
				200,
				{ "Content-Type": "application/json" },
				JSON.stringify([{  }]));
        });

        afterEach(function () {
			this.server.restore();
        });


        xit("ajax test", function () {
            var response;
            runs(function () {
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        response = JSON.parse(xhr.responseText);
                    }
                };
                xhr.open("GET", '../../test/json/geodataPlaces.json', true);
                xhr.send();
            });
            waitsFor(function () {
                return response;
            });
            runs(function () {
                expect(typeof response).toEqual('object');
            })


        });
    });
});