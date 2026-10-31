"use strict";
const fs = require("node:fs");
const { test, expect } = require("@playwright/test");
const mongoose = require("../../server/node_modules/mongoose");
const bcrypt = require("../../server/node_modules/bcryptjs");
const User = require("../../server/models/User");
const Doctor = require("../../server/models/Doctor");
const Appointment = require("../../server/models/Appointment");
const Notification = require("../../server/models/Notification");
const generateToken = require("../../server/utils/generateToken");
const {validatePlan} = require("../reviewedPlan.cjs");

const URI = "mongodb://127.0.0.1:27017/testpilot_generated_test";
const API = "http://127.0.0.1:5199";
let plan;
if (process.env.TESTPILOT_REVIEWED_PLAN_FILE) {
  plan = validatePlan(JSON.parse(fs.readFileSync(process.env.TESTPILOT_REVIEWED_PLAN_FILE, "utf8")));
}

test.describe("Human-reviewed model case plans — isolated deterministic API recipes", () => {
  test.describe.configure({mode:"serial"});
  if (!plan) {
    test("No signed-off plan supplied; never claim model tests passed", async () => {
      test.skip(true,"Supply a real approved plan to the manual isolated GitHub workflow.");
    });
    return;
  }
  let doctorId, date, patientToken, otherToken;
  const booking = (request, token, time="09:00", changes={}) =>
    request.post(API+"/api/v1/appointment/book",{
      headers:token?{Authorization:"Bearer "+token}:{},
      data:{doctorId,appointmentDate:date,appointmentTime:time,...changes}
    });
  function futureMonday() {
    const d = new Date();d.setHours(12,0,0,0);
    d.setDate(d.getDate()+((8-d.getDay())%7)+14);
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),
      String(d.getDate()).padStart(2,"0")].join("-");
  }
  async function syntheticDoctor(status,suffix) {
    const pwd=await bcrypt.hash("SyntheticPassword123",10);
    const user=await User.create({name:"Synthetic Doctor "+suffix,
      email:"synthetic-doctor-"+suffix+"@example.invalid",
      password:pwd,phone:"987654321"+suffix,isDoctor:true});
    return Doctor.create({userId:user._id,fullName:"Dr Synthetic "+suffix,
      email:user.email,phone:user.phone,specialization:"General Medicine",
      experience:"5 years",fees:500,address:"Fixture Clinic",
      slotDuration:30,status,weeklyAvailability:[{day:"Monday",enabled:true,
        sessions:[{startTime:"09:00",endTime:"11:00"}]}]});
  }
  test.beforeAll(async () => {
    if (process.env.CI !== "true" && process.env.TESTPILOT_ISOLATED_API !== "1")
      throw Error("Must explicitly enable disposable local tests.");
    if (process.env.NODE_ENV!=="test" || process.env.TESTPILOT_ISOLATED_API!=="1" ||
        process.env.MONGO_URI!==URI || process.env.MONGO_URI_TEST!==URI ||
        process.env.TESTPILOT_ALLOWED_BASE!==API)
      throw Error("Refusing non-local or non-disposable generated-case execution.");
    await mongoose.connect(URI);
    await Appointment.init();
  });
  test.afterAll(async()=>{if(mongoose.connection.readyState!==0)await mongoose.disconnect();});
  test.beforeEach(async()=>{
    await Appointment.deleteMany({});
    await Notification.deleteMany({});
    await Doctor.deleteMany({});
    await User.deleteMany({});
    date=futureMonday();
    const pwd=await bcrypt.hash("SyntheticPassword123",10);
    const one=await User.create({name:"Patient A",email:"patient-a@example.invalid",
      password:pwd,phone:"9876543210"});
    const two=await User.create({name:"Patient B",email:"patient-b@example.invalid",
      password:pwd,phone:"9876543211"});
    patientToken=generateToken(one._id);
    otherToken=generateToken(two._id);
    const doctor=await syntheticDoctor("approved","2");
    doctorId=doctor._id.toString();
  });

  for (const scenario of plan.cases) {
    test(scenario.id+" ["+scenario.category+"] "+scenario.title+
      " (reviewed recipe: "+scenario.recipe+")", async ({request})=>{
      const recipe=scenario.recipe;
      if (recipe.startsWith("register_")) {
        const password=recipe==="register_weak_password"?"Short12":
          recipe==="register_boundary_password"?"Valid123":"GoodPassword123";
        const response=await request.post(API+"/api/v1/auth/register",{
          data:{name:"New Synthetic Patient",email:"new-patient@example.invalid",
            phone:"9876543213",password}
        });
        expect(response.status()).toBe(recipe==="register_weak_password"?400:201);
        expect((await response.json()).success).toBe(recipe!=="register_weak_password");
        expect(await User.countDocuments({email:"new-patient@example.invalid"}))
          .toBe(recipe==="register_weak_password"?0:1);
      } else if (recipe==="approved_doctor_only") {
        await syntheticDoctor("pending","3");
        const response=await request.get(API+"/api/v1/doctor/all");
        expect(response.status()).toBe(200);
        const body=await response.json();
        expect(body.doctors).toHaveLength(1);
        expect(body.doctors[0]._id).toBe(doctorId);
      } else if (recipe==="empty_doctor_catalog") {
        await Doctor.deleteMany({});
        const response=await request.get(API+"/api/v1/doctor/all");
        expect(response.status()).toBe(200);
        expect((await response.json()).doctors).toEqual([]);
      } else if (recipe==="booking_valid") {
        const response=await booking(request,patientToken);
        expect(response.status()).toBe(201);
        expect((await response.json()).appointment.status).toBe("Pending");
        expect(await Appointment.countDocuments({doctorId})).toBe(1);
      } else if (recipe==="booking_conflict") {
        const first=await booking(request,patientToken);
        const second=await booking(request,otherToken);
        expect([first.status(),second.status()]).toEqual([201,409]);
        expect(await Appointment.countDocuments({doctorId})).toBe(1);
      } else if (recipe==="booking_missing_fields") {
        const response=await booking(request,patientToken,"09:00",
          {doctorId:"",appointmentDate:"",appointmentTime:""});
        expect(response.status()).toBe(400);
        expect(await Appointment.countDocuments({})).toBe(0);
      } else if (recipe==="booking_unauthenticated") {
        const response=await booking(request,null);
        expect(response.status()).toBe(401);
        expect(await Appointment.countDocuments({})).toBe(0);
      } else if (recipe==="booking_outside_hours") {
        const response=await booking(request,patientToken,"15:00");
        expect(response.status()).toBe(400);
        expect(await Appointment.countDocuments({})).toBe(0);
      } else if (recipe==="booking_concurrent") {
        const [a,b]=await Promise.all([
          booking(request,patientToken,"09:30"),booking(request,otherToken,"09:30")]);
        expect([a.status(),b.status()].sort()).toEqual([201,409]);
        expect(await Appointment.countDocuments({doctorId,appointmentTime:"09:30",
          status:{$in:["Pending","Approved"]}})).toBe(1);
      } else {
        throw Error("Unsupported recipe rejected before test creation: "+recipe);
      }
    });
  }
});
