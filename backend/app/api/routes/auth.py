async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    try:
        token = credentials.credentials

        print(f"Received token: {token[:30]}...")

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        print(f"Decoded payload: {payload}")

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except Exception as e:
        print(f"JWT ERROR: {e}")

        raise credentials_exception

    users_collection = get_users_collection()

    if users_collection is None:
        raise HTTPException(
            status_code=500,
            detail="Database unavailable"
        )

    from bson import ObjectId

    user = None

    # Try ObjectId first
    try:
        user = await users_collection.find_one({
            "_id": ObjectId(user_id)
        })
    except:
        pass

    # Try string id
    if not user:
        user = await users_collection.find_one({
            "_id": user_id
        })

    if not user:
        print("USER NOT FOUND")

        raise credentials_exception

    print(f"Authenticated user: {user['email']}")

    return user