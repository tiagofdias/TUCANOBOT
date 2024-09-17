const { DataTypes, Model, Sequelize } = require('sequelize');

module.exports = class PersistentRoles extends Model {
    static init(sequelize) {
        return super.init({
            IDPersistentRole: {
                type: DataTypes.INTEGER,
                unique: true,
                autoIncrement: true,
                primaryKey: true

            },
            ServerID: { type: DataTypes.STRING, allowNull: false},
            MemberID: { type: DataTypes.STRING, allowNull: false},
            RoleIDS: {type: DataTypes.STRING, allowNull: false}
        }, {
            tableName: 'PersistentRoles',
            timestamps: true,
            sequelize
        });
    }
}