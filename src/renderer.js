
import {
    BufferAttribute,
    BufferGeometry,
    Mesh,
    PerspectiveCamera,
    Scene,
    ShaderMaterial,
    TextureLoader,
    Vector3,
    WebGLRenderer,
} from './lib/three.module';

export class Renderer {
    constructor(width, height) {
        try {
            this.renderer = new WebGLRenderer({
                alpha: true,
            });
        } catch (e) {
            throw new Error('Could not initialize WebGL');
        }

        this.renderer.setClearColor(0x000000, 1);
        this.renderer.setSize(width, height);

        this.width = width;
        this.height = height;

        this.scene = new Scene();

        this.createCamera();
        this.scene.add(this.camera);
    }

    createCamera() {
        this.camera = new PerspectiveCamera(45, this.width / this.height, 1.0, 5000.0);

        const pos = new Vector3(0, 1000, 1000);

        this.camera.position.x = pos.x;
        this.camera.position.y = pos.y;
        this.camera.position.z = pos.z;
        this.camera.lookAt(0, 0, 0);
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;

        this.renderer.setSize(width, height);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    createShader() {
        const texture = new TextureLoader().load('/static/images/volcano_diff.jpg');
//        const lightmap = new TextureLoader().load('/static/images/terrain_lightmap.png');

        const shader = new ShaderMaterial({
            uniforms: {
                map: { type: 't', value: texture },
 //               light: { type: 't', value: lightmap },
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec2 vUV;

                void main() {
                    vNormal = normal;
                    vUV = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                varying vec2 vUV;

                uniform sampler2D map;
//                uniform sampler2D light;

                void main() {
//                    vec4 light = texture2D(light, vUV);
                    vec4 color = texture2D(map, vUV);
//                    color.rgb *= light.r;
                    gl_FragColor = color;
                }
            `,
        });

        return shader;
    }

    loadMesh(data) {
        const rawVertices = data.meshes[0].vertices;
        const rawNormals = data.meshes[0].normals;
        const rawFaces = data.meshes[0].faces;
        const rawUVs = data.meshes[0].texturecoords[0];

        console.log(data);

        const numFaces = rawFaces.length;
        const numVertices = numFaces * 3;

        const geom = new BufferGeometry();

        const vs = new Float32Array(numVertices * 3);
        const ns = new Float32Array(numVertices * 3);
        const uvs = new Float32Array(numVertices * 2);

        // [-795.5, -123.399, -795.5]
        // [795.5, 123.4, 795.5]
        for (let i = 0; i < numFaces; i++) {
            const a = rawFaces[i][0];
            const b = rawFaces[i][1];
            const c = rawFaces[i][2];

            vs[(i * 9) + 0] = rawVertices[(a * 3) + 0];
            vs[(i * 9) + 1] = rawVertices[(a * 3) + 1];
            vs[(i * 9) + 2] = rawVertices[(a * 3) + 2];

            vs[(i * 9) + 3] = rawVertices[(b * 3) + 0];
            vs[(i * 9) + 4] = rawVertices[(b * 3) + 1];
            vs[(i * 9) + 5] = rawVertices[(b * 3) + 2];

            vs[(i * 9) + 6] = rawVertices[(c * 3) + 0];
            vs[(i * 9) + 7] = rawVertices[(c * 3) + 1];
            vs[(i * 9) + 8] = rawVertices[(c * 3) + 2];

            ns[(i * 9) + 0] = rawNormals[(a * 3) + 0];
            ns[(i * 9) + 1] = rawNormals[(a * 3) + 1];
            ns[(i * 9) + 2] = rawNormals[(a * 3) + 2];

            ns[(i * 9) + 3] = rawNormals[(b * 3) + 0];
            ns[(i * 9) + 4] = rawNormals[(b * 3) + 1];
            ns[(i * 9) + 5] = rawNormals[(b * 3) + 2];

            ns[(i * 9) + 6] = rawNormals[(c * 3) + 0];
            ns[(i * 9) + 7] = rawNormals[(c * 3) + 1];
            ns[(i * 9) + 8] = rawNormals[(c * 3) + 2];

            uvs[(i * 6) + 0] = rawUVs[(a * 2) + 0];
            uvs[(i * 6) + 1] = rawUVs[(a * 2) + 1];

            uvs[(i * 6) + 2] = rawUVs[(b * 2) + 0];
            uvs[(i * 6) + 3] = rawUVs[(b * 2) + 1];

            uvs[(i * 6) + 4] = rawUVs[(c * 2) + 0];
            uvs[(i * 6) + 5] = rawUVs[(c * 2) + 1];
        }

        geom.addAttribute('position', new BufferAttribute(vs, 3));
        geom.addAttribute('normal', new BufferAttribute(ns, 3));
        geom.addAttribute('uv', new BufferAttribute(uvs, 2));

        const shader = this.createShader();
        const mesh = new Mesh(geom, shader);

        console.log('Mesh loaded successfully');

        this.scene.add(mesh);
    }
}
