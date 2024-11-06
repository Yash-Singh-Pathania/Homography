from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
import io
import json

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def order_points(points):
    # Convert to NumPy array
    rect = np.zeros((4, 2), dtype="float32")
    points = np.array(points, dtype="float32")

    # Sum and difference of points to find corners
    s = points.sum(axis=1)
    diff = np.diff(points, axis=1)

    rect[0] = points[np.argmin(s)]      # Top-left
    rect[2] = points[np.argmax(s)]      # Bottom-right
    rect[1] = points[np.argmin(diff)]   # Top-right
    rect[3] = points[np.argmax(diff)]   # Bottom-left

    return rect

def compute_homography(src_pts, dst_pts):
    """
    Computes the homography matrix from src_pts to dst_pts.
    """
    A = []
    for i in range(4):
        x, y = src_pts[i][0], src_pts[i][1]
        u, v = dst_pts[i][0], dst_pts[i][1]
        A.append([-x, -y, -1, 0, 0, 0, u * x, u * y, u])
        A.append([0, 0, 0, -x, -y, -1, v * x, v * y, v])

    A = np.array(A)
    U, S, Vt = np.linalg.svd(A)
    H = Vt[-1].reshape(3, 3)
    return H / H[-1, -1]

def apply_homography(img, H, width, height):
    """
    Applies the homography H to the input image img and maps it to a new image of size (width, height).
    Uses bilinear interpolation for better image quality.
    """
    H_inv = np.linalg.inv(H)
    transformed_img = np.zeros((height, width, 3), dtype=np.uint8)

    # Create a grid of (i, j) coordinates corresponding to the transformed image
    i_coords, j_coords = np.indices((height, width))
    ones = np.ones_like(i_coords)
    dest_coords = np.stack((j_coords, i_coords, ones), axis=-1)  # Shape: (height, width, 3)

    # Flatten the grid for vectorized computation
    dest_coords_flat = dest_coords.reshape(-1, 3).T  # Shape: (3, N)

    # Apply inverse homography to get source coordinates
    src_coords = H_inv @ dest_coords_flat  # Shape: (3, N)
    src_coords /= src_coords[2, :]  # Normalize by the third (homogeneous) coordinate
    x_coords = src_coords[0, :]
    y_coords = src_coords[1, :]

    valid_idx = (
        (x_coords >= 0) & (x_coords < img.shape[1] - 1) &
        (y_coords >= 0) & (y_coords < img.shape[0] - 1)
    )

    x_coords = x_coords[valid_idx]
    y_coords = y_coords[valid_idx]
    x0 = np.floor(x_coords).astype(np.int32)
    x1 = x0 + 1
    y0 = np.floor(y_coords).astype(np.int32)
    y1 = y0 + 1

    dx = x_coords - x0
    dy = y_coords - y0

    Ia = img[y0, x0]
    Ib = img[y0, x1]
    Ic = img[y1, x0]
    Id = img[y1, x1]

    wa = (1 - dx) * (1 - dy)
    wb = dx * (1 - dy)
    wc = (1 - dx) * dy
    wd = dx * dy
    interpolated_pixels = (wa[:, None] * Ia +
                           wb[:, None] * Ib +
                           wc[:, None] * Ic +
                           wd[:, None] * Id).astype(np.uint8)

    # Assign interpolated pixels to the transformed image
    transformed_indices = np.argwhere(valid_idx).flatten()
    transformed_img.reshape(-1, 3)[transformed_indices] = interpolated_pixels

    return transformed_img

@app.post("/transform")
async def transform_image(
    file: UploadFile = File(...),
    points: str = Form(...)
):
    # Read image file
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    img_array = np.array(image)
    height, width = img_array.shape[:2]

    points = json.loads(points)
    if len(points) != 4:
        return {"error": "Exactly 4 points are required."}

    src_pts = order_points(points)

    dst_pts = np.float32([[0, 0], [width - 1, 0],
                          [width - 1, height - 1], [0, height - 1]])

    H = compute_homography(src_pts, dst_pts)

    transformed_img = apply_homography(img_array, H, width, height)

    transformed_pil = Image.fromarray(transformed_img)

    buf = io.BytesIO()
    transformed_pil.save(buf, format="JPEG", quality=95)
    byte_im = buf.getvalue()

    return {"image": byte_im.hex()}
