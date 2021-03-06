
/// <reference path="../../Scripts/typings/jasmine/jasmine.d.ts" />


// todo make sure tests are enhanced to validate contents of view models and urls
// todo tests for invalid url combinations ? 

namespace NakedObjects.Test.Masks {
    describe("nakedobjects.gemini.tests.masks", () => {

        beforeEach(angular.mock.module("app"));

        describe("Mask", () => {

            let maskService: IMask;

            beforeEach(inject((mask: IMask) => {
                maskService = mask;
            }));


            function testMask(input: any, mask: string, format: formatType, expectedResult: string) {
                const result = maskService.toLocalFilter(mask, format).filter(input);
                expect(result).toBe(expectedResult);
            }

            function testDefaultMask(input: any, format: formatType, expectedResult: string) {
                testMask(input, "", format, expectedResult);
            }

            describe("default string", () => {
                it("masks empty", () => testDefaultMask("", "string", ""));
                it("masks null", () => testDefaultMask(null, "string", ""));
                it("masks a string", () => testDefaultMask("a string", "string", "a string"));
            });

            describe("default int", () => {
                it("masks empty", () => testDefaultMask("", "int", "0"));
                it("masks null", () => testDefaultMask(null, "int", null));
                it("masks 0", () => testDefaultMask(0, "int", "0"));
                it("masks 101", () => testDefaultMask(101, "int", "101"));
                it("masks 1002", () => testDefaultMask(1002, "int", "1,002"));
                it("masks 10003", () => testDefaultMask(10003, "int", "10,003"));
                it("masks max int", () => testDefaultMask(Number.MAX_VALUE, "int", "1.798e+308"));
            });

            const arbitaryDate1 = new Date(Date.UTC(1985, 5, 4, 16, 27, 10));
            const arbitaryDate2 = new Date(Date.UTC(2003, 1, 20, 1, 13, 55));
            const arbitaryDate3 = new Date(Date.UTC(2016, 7, 5, 23, 45, 8));

            describe("default date-time", () => {

                let ts1: string;
                let ts2: string;
                let ts3: string;

                beforeEach(() => {
                    maskService.setDateMaskMapping("test", "date-time", "d MMM yyyy HH:mm:ss");

                    const f = maskService.toLocalFilter("test", "date-time");

                    ts1 = f.filter(arbitaryDate1); // "4 Jun 1985 05:27:10"
                    ts2 = f.filter(arbitaryDate2); // "20 Feb 2003 01:13:55"
                    ts3 = f.filter(arbitaryDate3); // "6 Aug 2016 12:45:08"
                });

                it("masks empty", () => testDefaultMask("", "date-time", ""));
                it("masks null", () => testDefaultMask(null, "date-time", null));
            
                // these tests are locale specific UTC -> GMT/BST
                it("masks arbitaryDate1", () => testDefaultMask(arbitaryDate1, "date-time", ts1));
                it("masks arbitaryDate2", () => testDefaultMask(arbitaryDate2, "date-time", ts2));
                it("masks arbitaryDate3", () => testDefaultMask(arbitaryDate3, "date-time", ts3));
            });

            describe("default date", () => {
                it("masks empty", () => testDefaultMask("", "date", ""));
                it("masks null", () => testDefaultMask(null, "date", null));         

                // these tests are UTC => UTC
                it("masks arbitaryDate1", () => testDefaultMask(arbitaryDate1, "date", "4 Jun 1985"));
                it("masks arbitaryDate2", () => testDefaultMask(arbitaryDate2, "date", "20 Feb 2003"));
                it("masks arbitaryDate3", () => testDefaultMask(arbitaryDate3, "date", "5 Aug 2016"));
            });

            describe("default time", () => {
                it("masks empty", () => testDefaultMask("", "time", ""));
                it("masks null", () => testDefaultMask(null, "time", null));         

                // these tests are UTC => UTC
                it("masks arbitaryDate1", () => testDefaultMask(arbitaryDate1, "time", "16:27"));
                it("masks arbitaryDate2", () => testDefaultMask(arbitaryDate2, "time", "01:13"));
                it("masks arbitaryDate3", () => testDefaultMask(arbitaryDate3, "time", "23:45"));
            });

            describe("custom date-time", () => {

                beforeEach(() => {
                    maskService.setDateMaskMapping("customdt", "date-time", "M dd yyyy hh-mm-ss", "+1000");
                });


                it("masks empty", () => testMask("", "customdt", "date-time", ""));
                it("masks null", () => testMask(null, "customdt", "date-time", null));         

                // these tests are locale specific UTC -> +1000
                it("masks arbitaryDate1", () => testMask(arbitaryDate1, "customdt", "date-time", "6 05 1985 02-27-10"));
                it("masks arbitaryDate2", () => testMask(arbitaryDate2, "customdt", "date-time", "2 20 2003 11-13-55"));
                it("masks arbitaryDate3", () => testMask(arbitaryDate3, "customdt", "date-time", "8 06 2016 09-45-08"));
            });

            describe("custom date", () => {

                beforeEach(() => {
                    maskService.setDateMaskMapping("customd", "date", "M dd yyyy", "+1100");
                });

                it("masks empty", () => testMask("", "customd", "date", ""));
                it("masks null", () => testMask(null, "customd", "date", null));         

                // these tests are locale specific UTC -> +1000
                it("masks arbitaryDate1", () => testMask(arbitaryDate1, "customd", "date", "6 05 1985"));
                it("masks arbitaryDate2", () => testMask(arbitaryDate2, "customd", "date", "2 20 2003"));
                it("masks arbitaryDate3", () => testMask(arbitaryDate3, "customd", "date", "8 06 2016"));
            });

            describe("custom time", () => {

                beforeEach(() => {
                    maskService.setDateMaskMapping("customt", "time", "hh-mm-ss", "+0030");
                });

                it("masks empty", () => testMask("", "customt", "time", ""));
                it("masks null", () => testMask(null, "customt", "time", null));         
                                                    
                // these tests are UTC => UTC
                it("masks arbitaryDate1", () => testMask(arbitaryDate1, "customt", "time", "04-57-10"));
                it("masks arbitaryDate2", () => testMask(arbitaryDate2, "customt", "time", "01-43-55"));
                it("masks arbitaryDate3", () => testMask(arbitaryDate3, "customt", "time", "12-15-08"));
            });


        });


    });
}