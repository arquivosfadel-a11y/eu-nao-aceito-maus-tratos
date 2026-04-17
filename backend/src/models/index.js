const User = require('./User');
const City = require('./City');
const Department = require('./Department');
const Complaint = require('./Complaint');
const Message = require('./Message');
const ValidatorCity = require('./ValidatorCity');
const WorkLog = require('./WorkLog');
const Animal = require('./Animal');

// User -> City
User.belongsTo(City, { foreignKey: 'city_id', as: 'city' });
City.hasMany(User, { foreignKey: 'city_id', as: 'users' });

// User -> Department
User.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Department.hasMany(User, { foreignKey: 'department_id', as: 'members' });

// Department -> City
Department.belongsTo(City, { foreignKey: 'city_id', as: 'city' });
City.hasMany(Department, { foreignKey: 'city_id', as: 'departments' });

// Complaint -> User (cidadão)
Complaint.belongsTo(User, { foreignKey: 'citizen_id', as: 'citizen' });
User.hasMany(Complaint, { foreignKey: 'citizen_id', as: 'complaints' });

// Complaint -> City
Complaint.belongsTo(City, { foreignKey: 'city_id', as: 'city' });
City.hasMany(Complaint, { foreignKey: 'city_id', as: 'complaints' });

// Complaint -> Department
Complaint.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Department.hasMany(Complaint, { foreignKey: 'department_id', as: 'complaints' });

// Complaint -> User (secretário)
Complaint.belongsTo(User, { foreignKey: 'secretary_id', as: 'secretary' });
User.hasMany(Complaint, { foreignKey: 'secretary_id', as: 'assigned_complaints' });

// Complaint -> User (vereador)
Complaint.belongsTo(User, { foreignKey: 'councilman_id', as: 'councilman' });
User.hasMany(Complaint, { foreignKey: 'councilman_id', as: 'councilman_complaints' });

// Message -> Complaint
Message.belongsTo(Complaint, { foreignKey: 'complaint_id', as: 'complaint' });
Complaint.hasMany(Message, { foreignKey: 'complaint_id', as: 'messages' });

// Message -> User
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sent_messages' });

// Validator <-> City (many-to-many)
User.belongsToMany(City, {
  through: ValidatorCity,
  foreignKey: 'validator_id',
  otherKey: 'city_id',
  as: 'validatorCities'
});
City.belongsToMany(User, {
  through: ValidatorCity,
  foreignKey: 'city_id',
  otherKey: 'validator_id',
  as: 'validators'
});

ValidatorCity.belongsTo(User, { foreignKey: 'validator_id', as: 'validator' });
ValidatorCity.belongsTo(City, { foreignKey: 'city_id', as: 'city' });

// WorkLog -> City
WorkLog.belongsTo(City, { foreignKey: 'city_id', as: 'city' });
City.hasMany(WorkLog, { foreignKey: 'city_id', as: 'work_logs' });

// WorkLog -> Department
WorkLog.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Department.hasMany(WorkLog, { foreignKey: 'department_id', as: 'work_logs' });

// WorkLog -> User (secretário)
WorkLog.belongsTo(User, { foreignKey: 'secretary_id', as: 'secretary' });
User.hasMany(WorkLog, { foreignKey: 'secretary_id', as: 'work_logs' });

// Animal -> User (quem cadastrou)
Animal.belongsTo(User, { foreignKey: 'registered_by', as: 'registeredBy' });
User.hasMany(Animal, { foreignKey: 'registered_by', as: 'animals' });

// Animal -> City
Animal.belongsTo(City, { foreignKey: 'city_id', as: 'city' });
City.hasMany(Animal, { foreignKey: 'city_id', as: 'animals' });

module.exports = {
  User,
  City,
  Department,
  Complaint,
  Message,
  ValidatorCity,
  WorkLog,
  Animal
};