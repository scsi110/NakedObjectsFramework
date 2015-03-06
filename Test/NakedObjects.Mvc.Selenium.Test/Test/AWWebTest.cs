﻿// Copyright Naked Objects Group Ltd, 45 Station Road, Henley on Thames, UK, RG9 1AT
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. 
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and limitations under the License.

using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Threading;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using NakedObjects.DatabaseHelpers;
using NakedObjects.Mvc.Selenium.Test.Helper;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;

namespace NakedObjects.Mvc.Selenium.Test {
    [TestClass]
    public abstract class AWWebTest {
        #region chrome helper

        protected static string FilePath(string resourcename) {
            string fileName = resourcename; //.Remove(0, resourcename.IndexOf(".") + 1);

            string newFile = Path.Combine(Directory.GetCurrentDirectory(), fileName);

            if (File.Exists(newFile)) {
                File.Delete(newFile);
            }

            Assembly assembly = Assembly.GetExecutingAssembly();

            using (Stream stream = assembly.GetManifestResourceStream("NakedObjects.Mvc.Selenium.Test." + resourcename)) {
                using (FileStream fileStream = File.Create(newFile, (int) stream.Length)) {
                    var bytesInStream = new byte[stream.Length];
                    stream.Read(bytesInStream, 0, bytesInStream.Length);
                    fileStream.Write(bytesInStream, 0, bytesInStream.Length);
                }
            }

            return newFile;
        }

        #endregion

        #region overhead

        protected const string url = "http://mvc.nakedobjects.net:1081/UnitTestAjax";
        protected const string server = @"Saturn\SqlExpress";
        protected const string database = "AdventureWorks";
        protected const string backup = "AdventureWorks";

        //protected const string url = "http://localhost:56696/";
        //protected const string server = @".\SQLEXPRESS";
        //protected const string server = @"(localdb)\ProjectsV12";

        //protected const string database = "AdventureWorks";
        //protected const string backup = "AdventureWorks";

        protected IWebDriver br;
        protected SafeWebDriverWait wait;
        protected TimeSpan DefaultTimeOut = new TimeSpan(0, 0, 10);

        [ClassInitialize]
        public static void InitialiseClass(TestContext context) {
            try {
                DatabaseUtils.RestoreDatabase(database, backup, server);
            }
            catch (Exception e) {
                // just carry on - tests may fail
                var m = e.Message;
                Console.WriteLine(m);
            }
            KillAllProcesses("iexplore");
            KillAllProcesses("firefox");
        }

        private static void KillAllProcesses(string name) {
            try {
                Process[] processes = Process.GetProcessesByName(name);
                foreach (Process p in processes) {
                    try {
                        p.Kill();
                    }
                    catch {
                        //ignore
                    }
                }
            }
            catch {
                // ignore
            }
        }

        public virtual void CleanUpTest() {
            if (br != null) {
                try {
                    br.Manage().Cookies.DeleteAllCookies();
                    br.Quit();
                    br.Dispose();
                    br = null;
                }
                catch {
                    // to suppress error 
                }
            }

            //KillAllProcesses("iexplore");
            //KillAllProcesses("firefox");
        }

        protected IWebDriver InitChromeDriver() {
            //const string cacheDir = @"C:\SeleniumTestFolder";

            var crOptions = new ChromeOptions();

            crOptions.AddArgument(@"--test-type");
            //crOptions.AddArgument(@"--user-data-dir=" + cacheDir);
            var cd = new ChromeDriver(crOptions);

            // test workaround for chromedriver problem https://groups.google.com/forum/#!topic/selenium-users/nJ0NF1UJ3WU
            //Thread.Sleep(5000);
            return cd;
        }

        #endregion

        #region Helpers

        protected void Login() {
            //Login("scascarini", "password");
            Thread.Sleep(2000);
        }

        protected void Login(string username, string password) {
            br.FindElement(By.Id("UserName")).SendKeys(username + Keys.Tab);
            br.FindElement(By.Id("Password")).SendKeys(password + Keys.Tab);
            br.FindElement(By.CssSelector("input[type='submit']")).BrowserSpecificClick(br);
            Thread.Sleep(5000);
        }

        protected void FindCustomerByAccountNumber(string accountNumber) {
            br.ClickAction("CustomerRepository-FindCustomerByAccountNumber");
            IWebElement f = br.GetField("CustomerRepository-FindCustomerByAccountNumber-AccountNumber");
            f.TypeText(accountNumber, br);
            f.Click();
            // f.TypeText(Keys.Tab, br);
            br.ClickOk();
            br.AssertContainsObjectView();
        }

        protected void FindOrder(string orderNumber) {
            br.ClickAction("OrderRepository-FindOrder");
            br.GetField("OrderRepository-FindOrder-OrderNumber").TypeText(orderNumber, br);
            br.ClickOk();
            br.AssertContainsObjectView();
        }

        protected void FindProduct(string productNumber) {
            br.ClickAction("ProductRepository-FindProductByNumber");
            br.GetField("ProductRepository-FindProductByNumber-Number").TypeText(productNumber, br);
            br.ClickOk();
            br.AssertContainsObjectView();
        }

        protected void FindSalesPerson(string lastName) {
            br.ClickAction("SalesRepository-FindSalesPersonByName");
            br.GetField("SalesRepository-FindSalesPersonByName-LastName").TypeText(lastName, br);
            br.ClickOk();
            br.AssertContainsObjectView();
        }

        #endregion
    }
}