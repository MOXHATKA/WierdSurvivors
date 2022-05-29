import Phaser from "phaser";
import Sprite from "../components/Sprite";
import PlayerTag from "../components/PlayerTag";
import * as PlayerObj from "../objects/Player";
import Input from "../components/Input";

import playerMovementSystem from "../systems/playerMovement";
import ecs from "../ECSInstance";
import { WebSocketPlugin } from "../plagins/websocket";
import PlayerNetTag from "../components/PlayerNetTag";
import playerNetMovementSystem from "../systems/playerNetMovementSystem";

export default class Game extends Phaser.Scene {
    player!: number;
    bg!: Phaser.GameObjects.TileSprite;
    players!: Map<string, number>;
    constructor() {
        super("game");
    }

    async create() {
        this.scene.run("ui-scene");
        this.players = new Map<string, number>();
        let plugin = this.plugins.get("WebSocketPlugin") as WebSocketPlugin;
        this.bg = this.add
            .tileSprite(0, 0, this.scale.width, this.scale.height, "background")
            .setOrigin(0);
        this.scale.on("resize", this.resize, this);

        this.player = ecs.createEntity();
        const sprite = Sprite;
        const player = new PlayerObj.default(
            this,
            this.scale.width / 2,
            this.scale.height / 2
        );
        sprite.sprite[this.player] = player;
        ecs.addComponent(this.player, PlayerTag);
        ecs.addComponent(this.player, Sprite);
        ecs.addComponent(this.player, Input);

        var camera = this.cameras.main.setBounds(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );
        // camera.zoom = 2;
        camera.startFollow(sprite.sprite[this.player]);

        this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            if (true) {
                var vect = pointer.positionToCamera(
                    this.cameras.main
                ) as Phaser.Math.Vector2;
                Input.x[this.player] = vect.x;
                Input.y[this.player] = vect.y;
            }
        });
        playerMovementSystem(this);
        var room = await plugin.Connect({ x: player.x, y: player.y });
        this.time.addEvent({
            delay: 200,
            callback: () => {
                room.send("send_position", { x: player.x, y: player.y });
                console.debug("Set pos");
            },
            loop: true,
        });
        room.onMessage("joinPlayer", (message) => {
            const pl = ecs.createEntity();
            this.players.set(message.id, pl);
            const sprite = Sprite;
            const player = new PlayerObj.default(
                this,
                this.scale.width / 2,
                this.scale.height / 2
            );
            player.x = message.x;
            player.y = message.y;
            sprite.sprite[pl] = player;
            ecs.addComponent(pl, PlayerTag);
            ecs.addComponent(pl, Sprite);
        });
        room.onMessage("updatePosition", (message) => {
            if (!this.players.has(message.id)) return;
            const player = this.players.get(message.id) as number;
            Input.x[player] = message.x;
            Input.y[player] = message.y;
        });
        room.onMessage("updatePlayers", (message) => {
            message.players.forEach((element: any) => {
                const pl = ecs.createEntity();
                this.players.set(element.key, pl);
                const sprite = Sprite;
                const player = new PlayerObj.default(
                    this,
                    this.scale.width / 2,
                    this.scale.height / 2
                );
                player.x = message.x;
                player.y = message.y;
                sprite.sprite[pl] = player;
                ecs.addComponent(pl, PlayerNetTag);
				ecs.addComponent(pl, Input);
                ecs.addComponent(pl, Sprite);
            });
        });
    }

    resize(
        gameSize: { width: number; height: number },
        baseSize: any,
        displaySize: any,
        resolution: any
    ) {
        var width = gameSize.width;
        var height = gameSize.height;

        this.cameras.resize(width, height);
        this.bg.setSize(width, height);
    }

    update(time: number, delta: number) {
        playerMovementSystem(this);
		playerNetMovementSystem(this);
    }
}
