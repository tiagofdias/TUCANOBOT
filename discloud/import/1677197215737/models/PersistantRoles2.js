const { DataTypes, Model, Sequelize } = require('sequelize');

module.exports = class PersistentRoles2 extends Model {
    static init(sequelize) {
        return super.init({
            IDPersistentRole2: {
                type: DataTypes.INTEGER,
                unique: true,
                autoIncrement: true,
                primaryKey: true

            },
            ServerID: { type: DataTypes.STRING, allowNull: false, unique: true },
            Status: { type: DataTypes.BOOLEAN, allowNull: false},
        }, {
            tableName: 'PersistentRoles2',
            timestamps: true,
            sequelize
        });
    }
}